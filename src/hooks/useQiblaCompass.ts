import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

import { normalizeDegrees, normalizeSignedAngle } from "../services/qibla";

export function useQiblaCompass(enabled: boolean, qiblaBearing: number | null) {
  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [headingReference, setHeadingReference] = useState<"true" | "magnetic" | null>(null);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  const [error, setError] = useState<string | null>(null);
  const [aligned, setAligned] = useState(false);
  const alignedRef = useRef(false);
  const lastAlignmentHapticRef = useRef(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => setAppActive(state === "active"));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!enabled || !appActive || Platform.OS === "web") {
      // Native subscription shutdown must clear stale direction and calibration state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeading(null);
      setAccuracy(null);
      setHeadingReference(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;
    setError(null);
    const unavailable = () => {
      if (cancelled) return;
      setHeading(null);
      setAccuracy(null);
      setHeadingReference(null);
      setError("The compass is unavailable on this device.");
    };

    void Promise.resolve().then(() => Location.watchHeadingAsync(
      (reading) => {
        if (cancelled) return;
        const nextHeading = reading.trueHeading >= 0 ? reading.trueHeading : reading.magHeading;
        setHeadingReference(reading.trueHeading >= 0 ? "true" : "magnetic");
        setAccuracy(reading.accuracy);
        if (!Number.isFinite(reading.accuracy) || reading.accuracy < 2 || !Number.isFinite(nextHeading) || nextHeading < 0) {
          setHeading(null);
          return;
        }
        setError(null);
        setHeading((current) => {
          if (current === null) return normalizeDegrees(nextHeading);
          const shortestChange = normalizeSignedAngle(nextHeading - current);
          return normalizeDegrees(current + shortestChange * 0.28);
        });
      },
      unavailable
    )).then((result) => {
      if (cancelled) result.remove();
      else subscription = result;
    }).catch(unavailable);

    return () => {
      cancelled = true;
      try { subscription?.remove(); } catch { /* The screen is no longer using the sensor. */ }
    };
  }, [appActive, enabled]);

  const relativeAngle =
    qiblaBearing !== null && heading !== null ? normalizeSignedAngle(qiblaBearing - heading) : null;

  useEffect(() => {
    const magnitude = relativeAngle === null ? Number.POSITIVE_INFINITY : Math.abs(relativeAngle);
    let nextAligned = alignedRef.current;
    if (!nextAligned && magnitude <= 4) nextAligned = true;
    else if (nextAligned && magnitude >= 8) nextAligned = false;

    const enteredAlignment = nextAligned && !alignedRef.current;
    if (nextAligned !== alignedRef.current) {
      alignedRef.current = nextAligned;
      setAligned(nextAligned);
    }

    if (enteredAlignment && Date.now() - lastAlignmentHapticRef.current > 5_000) {
      lastAlignmentHapticRef.current = Date.now();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
  }, [relativeAngle]);

  return { heading, accuracy, headingReference, relativeAngle, aligned, error };
}
