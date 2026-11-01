import { useEffect, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { AppState, StyleSheet, useWindowDimensions, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { useTextScale } from "../typography";
import { createThemedStyles } from "../theme";
import { HeroArtwork } from "./HeroArtwork";
import type { PrayerFocus } from "../services/prayerPeriods";
import type { HeroArtworkId, PrayerState, TimeFormat } from "../types";
import { formatDuration, formatPrayerTime, type PrayerGuidanceWindow } from "../utils/time";

export function PrayerHeroCard({ focus, remaining, progress, guidance, next, timeFormat, timeZone, artwork, onOpenGuidance, live = false }: {
  focus: PrayerFocus; remaining: number; progress: number; guidance: PrayerGuidanceWindow | null;
  next: PrayerState["next"]; timeFormat: TimeFormat; timeZone: string;
  artwork: HeroArtworkId;
  onOpenGuidance?: () => void;
  live?: boolean;
}) {
  const { colors, styles, isDark } = useStyles();
  const { language, t } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();

  const condensed = width < 360 && (language === "bn" || textScale * fontScale > 1.15);

  const danger = Boolean(guidance);
  const ending = danger || focus.phase === "ends";
  const target = guidance?.end ?? focus.target;
  const ink = danger ? colors.heroDanger : colors.ink;
  const muted = danger ? colors.dangerHeroMuted : colors.heroMuted;
  const accent = danger ? colors.heroDanger : colors.accent;
  const showNext = next && (danger || next.name !== focus.prayer);
  const nextSharesTarget = showNext && next.date.getTime() === target.getTime();

  return <LinearGradient testID="prayer-hero" colors={danger ? [colors.dangerHeroStart, colors.dangerHeroEnd] : [colors.heroStart, colors.heroEnd]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)" }]}>
    <HeroArtwork artwork={artwork} muted={danger} />
    <View style={styles.header}>
      <View style={styles.headingCopy}>
        <Text style={[styles.name, { color: ink }]}>{guidance ? "Prohibited time" : focus.prayer}</Text>
        <Text style={[styles.phase, { color: muted }]}>{ending ? "ends in" : "starts in"}</Text>
      </View>
      {danger && onOpenGuidance ? <Pressable accessibilityRole="button" accessibilityLabel="About prohibited times" onPress={onOpenGuidance} style={styles.infoButton}>
        <Ionicons name="information-circle-outline" size={22} color={accent} />
      </Pressable> : null}
    </View>
    <View style={styles.timeRow}>
      <PrayerCountdown target={target.getTime()} remaining={remaining} live={live} color={ink} />
    </View>
    {guidance?.summary ? <Text style={[styles.guidanceNote, { color: muted }]}>{guidance.summary}</Text> : null}
    <View accessible={false} style={[styles.track, { backgroundColor: danger ? colors.dangerHeroTrack : colors.heroTrack }]}>
      <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: accent }]} />
    </View>
    {condensed && !nextSharesTarget ? <View style={styles.nextRow}>
      <Text style={[styles.nextPrayer, { color: muted }]}>{ending ? "Ends at" : "Starts at"}</Text>
      <Text style={[styles.nextTime, { color: ink }]}>{formatPrayerTime(target, timeFormat, timeZone, language)}</Text>
    </View> : null}
    {showNext ? <View style={styles.nextRow}>
      <Text style={[styles.nextPrayer, { color: muted }]}>{t("Next · {prayer}", { prayer: next.name })}</Text>
      <Text style={[styles.nextTime, { color: ink }]}>{formatPrayerTime(next.date, timeFormat, timeZone, language)}</Text>
    </View> : null}
  </LinearGradient>;
}
// Only this subtree ticks; calculations and app-wide state keep their cadence.
function PrayerCountdown({ target, remaining, live, color }: { target: number; remaining: number; live: boolean; color: string }) {
  const { styles } = useStyles();
  const { language } = useI18n();
  const { fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const focused = useIsFocused();
  const [now, setNow] = useState(Date.now);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!live || !focused) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    function resume() {
      if (timer) clearInterval(timer);
      setNow(Date.now());
      timer = setInterval(() => setNow(Date.now()), 1000);
    }
    if (AppState.currentState === "active") resume();
    const subscription = AppState.addEventListener("change", state => {
      if (state === "active") resume();
      else { clearInterval(timer); timer = undefined; }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [focused, live, target]);
  const duration = formatDuration(live ? target - now : remaining, language, true);
  const size = width ? Math.min(38, width / (duration.length * 0.66 * textScale * fontScale)) : 38;
  return <View testID="hero-countdown" style={styles.countdown} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Text localize={false} accessibilityLiveRegion="none" numberOfLines={1} adjustsFontSizeToFit style={[styles.duration, { color, fontSize: size }]}>{duration}</Text>
  </View>;
}

const useStyles = createThemedStyles(() => StyleSheet.create({
  card: { padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", gap: 4 },
  headingCopy: { flex: 1, flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  infoButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 },
  name: { fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 25, letterSpacing: -0.5, flexShrink: 1 },
  phase: { fontFamily: "BricolageGrotesque_400Regular", fontSize: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", minHeight: 78, marginTop: 2 },
  countdown: { flex: 1, marginEnd: 88, minWidth: 0 },
  duration: { fontFamily: "BricolageGrotesque_700Bold", fontSize: 38, letterSpacing: -1, fontVariant: ["tabular-nums"] },
  guidanceNote: { fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, lineHeight: 18, marginTop: 4 },
  track: { height: 4, borderRadius: 2, marginTop: 16, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  nextRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 12 },
  nextPrayer: { fontFamily: "BricolageGrotesque_500Medium", fontSize: 12 },
  nextTime: { fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, fontVariant: ["tabular-nums"] }
}));
