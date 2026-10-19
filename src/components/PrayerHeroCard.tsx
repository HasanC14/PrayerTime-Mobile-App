import { useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { useTextScale } from "../typography";
import { createThemedStyles } from "../theme";
import { BrandMark } from "./BrandMark";
import type { PrayerFocus } from "../services/prayerPeriods";
import type { PrayerState, TimeFormat } from "../types";
import { formatDuration, formatPrayerTime, type PrayerGuidanceWindow } from "../utils/time";

export function PrayerHeroCard({ focus, remaining, progress, guidance, next, timeFormat, timeZone }: {
  focus: PrayerFocus; remaining: number; progress: number; guidance: PrayerGuidanceWindow | null;
  next: PrayerState["next"]; timeFormat: TimeFormat; timeZone: string;
}) {
  const { colors, styles, isDark } = useStyles();
  const { language, t } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const [countdownWidth, setCountdownWidth] = useState(0);
  const condensed = width < 360 && (language === "bn" || textScale * fontScale > 1.15);
  const duration = formatDuration(remaining, language);
  const durationSize = countdownWidth ? Math.min(38, countdownWidth / (duration.length * 0.66 * textScale * fontScale)) : 38;
  const danger = Boolean(guidance);
  const ending = danger || focus.phase === "ends";
  const target = guidance?.end ?? focus.target;
  const ink = danger ? colors.danger : colors.ink;
  const muted = danger ? colors.dangerHeroMuted : colors.heroMuted;
  const accent = danger ? colors.danger : colors.accent;
  const showNext = next && (danger || next.name !== focus.prayer);
  const nextSharesTarget = showNext && next.date.getTime() === target.getTime();

  return <LinearGradient testID="prayer-hero" colors={danger ? [colors.dangerHeroStart, colors.dangerHeroEnd] : [colors.heroStart, colors.heroEnd]}
    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)" }]}>
    <View style={styles.header}>
      {danger ? <Ionicons name="warning-outline" size={20} color={accent} /> : null}
      <Text style={[styles.name, { color: ink }]}>{guidance ? "Prohibited time" : focus.prayer}</Text>
      <Text style={[styles.phase, { color: muted }]}>{ending ? "ends in" : "starts in"}</Text>
    </View>
    <View style={styles.timeRow}>
      <View style={styles.countdown} onLayout={event => setCountdownWidth(event.nativeEvent.layout.width)}>
        <Text accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit style={[styles.duration, { color: ink, fontSize: durationSize }]}>{duration}</Text>
      </View>
      <View pointerEvents="none" style={styles.artwork}>
        <BrandMark height={96} color={accent} />
      </View>
    </View>
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
const useStyles = createThemedStyles(() => StyleSheet.create({
  card: { padding: 18, borderRadius: 24, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "baseline", gap: 8, flexWrap: "wrap" },
  name: { fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 25, letterSpacing: -0.5, flexShrink: 1 },
  phase: { fontFamily: "BricolageGrotesque_400Regular", fontSize: 12 },
  timeRow: { flexDirection: "row", alignItems: "center", minHeight: 78, marginTop: 2 },
  countdown: { flex: 1, marginEnd: 88, minWidth: 0 },
  duration: { fontFamily: "BricolageGrotesque_700Bold", fontSize: 38, letterSpacing: -1, fontVariant: ["tabular-nums"] },
  artwork: { position: "absolute", end: 0, top: -7, width: 72, height: 96, alignItems: "center", opacity: 0.22 },
  track: { height: 4, borderRadius: 2, marginTop: 16, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 2 },
  nextRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 12 },
  nextPrayer: { fontFamily: "BricolageGrotesque_500Medium", fontSize: 12 },
  nextTime: { fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, fontVariant: ["tabular-nums"] }
}));
