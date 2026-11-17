import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle, G, Line } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../i18n/context";
import { AppButton, ScreenHeader, SurfaceCard } from "../components/ui";
import { useQiblaCompass } from "../hooks/useQiblaCompass";
import { KaabaIcon } from "../components/KaabaIcon";
import { CompassCalibrationGuide, CompassCalibrationSheet } from "../components/CompassCalibrationSheet";
import { getCompassDirection, getQiblaBearing, getCompassPresentation } from "../services/qibla";
import { createThemedStyles, radii, spacing } from "../theme";
import type { AppLocation, LocationIssue } from "../types";

const QIBLA_LOCATION_STALE_MS = 15 * 60_000;

export function QiblaScreen({
  location,
  locating,
  locationIssue,
  onUsePhoneLocation,
  onOpenPhoneSettings
}: {
  location: AppLocation;
  locating: boolean;
  locationIssue: LocationIssue | null;
  onUsePhoneLocation: (requestPermission: boolean) => void;
  onOpenPhoneSettings: () => void;
}) {
  const { colors, styles } = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { width: viewportWidth } = useWindowDimensions();
  const focused = useIsFocused();
  const refreshAttemptedForCapture = useRef<number | null>(null);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [calibrationShown, setCalibrationShown] = useState(false);
  const qiblaBearing = getQiblaBearing(location);
  const liveCompassEnabled = focused && location.source === "device" && qiblaBearing !== null;
  const compass = useQiblaCompass(liveCompassEnabled, qiblaBearing);
  const { needleRotation, markers } = getCompassPresentation(qiblaBearing, compass.heading);
  const dialSize = Math.min(
    248,
    Math.max(0, viewportWidth - spacing.xl * 4 - 4),
  );
  const needsCalibration = compass.accuracy !== null && Number.isFinite(compass.accuracy) && compass.accuracy >= 0 && compass.accuracy < 2;

  useEffect(() => {
    if (!focused) {
      // Navigation should dismiss the guide instead of reopening it on return.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCalibrationOpen(false);
      return;
    }
    if (!liveCompassEnabled || !needsCalibration || calibrationShown) return;
    const timer = setTimeout(() => {setCalibrationShown(true); setCalibrationOpen(true);}, 2000);
    return () => clearTimeout(timer);
  }, [focused, liveCompassEnabled, needsCalibration, calibrationShown]);

  useEffect(() => {
    if (!focused) {
      refreshAttemptedForCapture.current = null;
      return;
    }
    if (
      !locating &&
      location.source === "device" &&
      Date.now() - location.capturedAt > QIBLA_LOCATION_STALE_MS &&
      refreshAttemptedForCapture.current !== location.capturedAt
    ) {
      refreshAttemptedForCapture.current = location.capturedAt;
      onUsePhoneLocation(false);
    }
  }, [focused, locating, location.capturedAt, location.source, onUsePhoneLocation]);

  const turnInstruction = (() => {
    if (qiblaBearing === null) return "You are at the Kaaba";
    if (compass.relativeAngle === null) return `${Math.round(qiblaBearing)}° clockwise from true north`;
    if (compass.aligned) return "You are facing the Qibla";
    return t(compass.relativeAngle > 0 ? "Turn right · {degrees}°" : "Turn left · {degrees}°", {degrees: Math.round(Math.abs(compass.relativeAngle))});
  })();

  return (
    <View style={styles.screen}>
    <ScreenHeader title="Qibla" subtitle={`Direction from ${location.name}`} />
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: spacing.xs, paddingBottom: Math.max(insets.bottom, spacing.xxl) }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <SurfaceCard style={styles.compassCard}>
          <View
            accessibilityLabel={t(turnInstruction)}
            style={[
              styles.dial,
              {
                borderRadius: dialSize / 2,
                height: dialSize,
                width: dialSize,
              },
            ]}
          >
            <Svg width={dialSize} height={dialSize} style={StyleSheet.absoluteFill} accessible={false}>
              <Circle cx={dialSize / 2} cy={dialSize / 2} r={dialSize * .34} fill={colors.compassSurface} opacity={.55} />
              <Circle cx={dialSize / 2} cy={dialSize / 2} r={dialSize / 2 - 2} fill="none" stroke={compass.aligned ? colors.success : colors.border} strokeWidth={compass.aligned ? 2 : 1} />
              <G rotation={-(compass.heading ?? 0)} origin={`${dialSize / 2}, ${dialSize / 2}`}>
                {Array.from({length: 60}, (_, index) => {
                  const angle = index * Math.PI / 30;
                  const outer = dialSize * .39;
                  const inner = outer - (index % 5 === 0 ? 10 : 4);
                  return <Line key={index} x1={dialSize / 2 + Math.sin(angle) * inner} y1={dialSize / 2 - Math.cos(angle) * inner}
                    x2={dialSize / 2 + Math.sin(angle) * outer} y2={dialSize / 2 - Math.cos(angle) * outer}
                    stroke={index === 0 ? colors.accent : colors.compassTicks} strokeWidth={index % 5 === 0 ? 1.5 : 1} strokeLinecap="round" />;
                })}
              </G>
            </Svg>
            <View style={styles.phoneTop} />
            {markers.map(marker => <View key={marker.direction} testID={`compass-${marker.direction}`}
              style={[styles.cardinalPosition, { left: dialSize / 2 + marker.x * (dialSize / 2 - 17) - 34,
                top: dialSize / 2 + marker.y * (dialSize / 2 - 17) - 15 }]}>
              <Text style={[styles.cardinal, marker.direction === "N" && { color: colors.accent }]}>{marker.direction}</Text>
            </View>)}
            <View style={[styles.needleWrap, { height: dialSize * 0.72, transform: [{ rotate: `${needleRotation}deg` }] }]}>
              <View style={[styles.needleStem, compass.aligned && {backgroundColor: colors.success}]} />
              <View style={styles.needle}>
                <View style={{transform: [{rotate: `${-needleRotation}deg`}]}}><KaabaIcon size={26} /></View>
              </View>
            </View>
            <View style={styles.dialCenter}>
              <View style={styles.dialCenterDot} />
            </View>
          </View>

          <View style={[styles.directionPill, compass.aligned && styles.directionPillAligned]}>
            <Ionicons
              name={compass.aligned ? "checkmark-circle" : "phone-portrait-outline"}
              size={18}
              color={compass.aligned ? colors.success : colors.accent}
            />
            <Text style={[styles.directionText, compass.aligned && styles.directionTextAligned]}>
              {needsCalibration ? "Calibrate your compass" : turnInstruction}
            </Text>
          </View>
          <View style={styles.bearingRow}>
            <Text style={styles.kaabaLabel}>Kaaba · Makkah</Text>
            <Text style={styles.bearingLabel}>{qiblaBearing === null ? "—" : `${Math.round(qiblaBearing)}° ${getCompassDirection(qiblaBearing)}`}</Text>
          </View>
          {compass.heading === null && !needsCalibration ? <Text style={styles.phoneHeading}>North-up view</Text> : null}
        </SurfaceCard>

        {location.source !== "device" ? (
          <SurfaceCard style={styles.manualNotice}>
            <Ionicons name="information-circle-outline" size={22} color={colors.accent} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Based on your chosen city</Text>
              <Text style={styles.noticeText}>
                Use your phone location for live direction.
              </Text>
            </View>
            <AppButton
              label="Use phone location"
              loading={locating}
              variant="quiet"
              onPress={() => onUsePhoneLocation(true)}
              style={styles.noticeButton}
            />
          </SurfaceCard>
        ) : (
          <View style={styles.tips}>
            {needsCalibration && !calibrationOpen && calibrationShown ? <CompassCalibrationGuide active={focused} compact /> : !needsCalibration ? <View style={styles.tipRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.tipText}>Hold your phone flat and level.</Text>
            </View> : null}
            {compass.error ? <Text style={styles.errorText}>{compass.error}</Text> : null}
            {compass.heading !== null && compass.headingReference === "magnetic" ? <Text style={styles.tipText}>Using magnetic north fallback; direction may vary slightly.</Text> : null}
          </View>
        )}

        {locationIssue ? (
          <View accessibilityLiveRegion="polite" style={styles.locationIssue}>
            <Ionicons name="location-outline" size={20} color={colors.warningText} />
            <View style={styles.locationIssueCopy}>
              <Text style={styles.locationIssueText}>{locationIssue.message}</Text>
              {locationIssue.canOpenSettings ? (
                <AppButton
                  label="Open phone settings"
                  variant="quiet"
                  onPress={onOpenPhoneSettings}
                  style={styles.locationIssueButton}
                />
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
    <CompassCalibrationSheet visible={focused && liveCompassEnabled && calibrationOpen} accuracy={compass.accuracy} onClose={() => setCalibrationOpen(false)} />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  page: { alignSelf: "center", maxWidth: 620, width: "100%" },
  compassCard: { alignItems: "center", paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl },
  bearingRow: {flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16},
  bearingLabel: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, fontWeight: "600" },
  dial: { direction: "ltr",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
    position: "relative",
  },
  phoneTop: {position: "absolute", top: -4, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent},
  cardinal: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 11, fontWeight: "700", textAlign: "center" },
  cardinalPosition: { position: "absolute", width: 68, minHeight: 30, alignItems: "center", justifyContent: "center" },
  phoneHeading: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, marginTop: 8, textAlign: "center" },
  kaabaLabel: {color: colors.accent, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12},
  needleWrap: { alignItems: "center", justifyContent: "flex-start", position: "absolute", width: 40 },
  needleStem: {position: "absolute", top: 18, bottom: 18, width: 2, backgroundColor: colors.accent},
  needle: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  dialCenter: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 10, height: 20, justifyContent: "center", position: "absolute", width: 20 },
  dialCenterDot: { backgroundColor: colors.ink, borderRadius: 3, height: 6, width: 6 },
  directionPill: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radii.pill, flexDirection: "row", gap: spacing.sm, minHeight: 42, paddingHorizontal: spacing.lg },
  directionPillAligned: { backgroundColor: colors.successSurface },
  directionText: { flexShrink: 1, textAlign: "center", color: colors.accent, fontFamily: "BricolageGrotesque_700Bold", fontSize: 14, fontWeight: "700" },
  directionTextAligned: { color: colors.success },
  manualNotice: { alignItems: "flex-start", flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.lg, padding: spacing.lg },
  noticeCopy: { flex: 1, minWidth: 220 },
  noticeTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, fontWeight: "700" },
  noticeText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 18, marginTop: 3 },
  noticeButton: { minHeight: 46, width: "100%" },
  tips: { gap: spacing.md, marginTop: spacing.xl, paddingHorizontal: spacing.sm },
  tipRow: { alignItems: "center", flexDirection: "row", gap: spacing.md },
  tipText: { color: colors.inkSoft, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13 },
  errorText: { color: colors.danger, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, textAlign: "center" },
  locationIssue: { alignItems: "flex-start", backgroundColor: colors.warningSurface, borderRadius: radii.md, flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md },
  locationIssueCopy: { flex: 1 },
  locationIssueText: { color: colors.warningText, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 17 },
  locationIssueButton: { alignSelf: "flex-start", marginTop: spacing.sm, minHeight: 42 }
}));
