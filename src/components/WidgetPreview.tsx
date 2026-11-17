import {StyleSheet, View} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Text} from "../i18n/native";
import {useI18n} from "../i18n/context";
import {createThemedStyles} from "../theme";
import {formatDuration, getProgressBetween} from "../utils/time";
import type {HomeWidgetKind, PrayerWidgetProps} from "../services/widgetTimeline";
import {blendWidgetColor, getWidgetAppearance} from "../constants/appearance";
import {WidgetBackdrop} from "./WidgetBackdrop";

// These proportions and information priorities mirror the installed widgets.
export function WidgetPreview({kind, preview, now, miniature = false}: {kind: HomeWidgetKind; preview: PrayerWidgetProps | null; now: number; miniature?: boolean}) {
  const {colors, styles, resolvedMode} = useStyles();
  const palette = getWidgetAppearance(resolvedMode).light;
  const {language, t} = useI18n();
  const hero = preview?.hero;
  const summary = preview?.summary;
  const danger = kind === "hero" && hero?.danger;
  const ink = danger ? colors.heroDanger : colors.ink;
  const muted = danger ? colors.dangerHeroMuted : colors.heroMuted;
  const decorative = kind === "hero" || kind === "next";
  const labels = {hero: "Prayer card", next: "Next prayer", summary: "Day summary", times: "Prayer times"};
  const content = !preview || preview.empty ? <View style={styles.empty}>
    <Ionicons name="moon-outline" size={26} color={colors.accent} />
    <Text allowFontScaling={!miniature} style={styles.title}>{preview?.prayer ?? "Choose your location"}</Text>
    <Text allowFontScaling={!miniature} style={styles.caption}>Open PrayerTime</Text>
  </View> : kind === "hero" && hero ? <>
    <View style={styles.heroHeader}>
      <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={[styles.title, {color: ink}]}>{hero.prayer}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={[styles.caption, {color: muted}]}>{hero.phaseLabel}</Text>
    </View>
    <Text allowFontScaling={!miniature} localize={false} numberOfLines={1} adjustsFontSizeToFit style={[styles.countdown, {color: ink}]}>{formatDuration(hero.target - now, language, true)}</Text>
    {hero.phase === "starts" || hero.windowRange ? <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={[styles.window, {color: muted}]}>
      {hero.phase === "ends" ? hero.windowRange : `${hero.targetLabel} ${hero.targetTime}`}
    </Text> : null}
    <View style={[styles.track, {backgroundColor: danger ? palette.dangerTrack : palette.track}]}>
      <View style={[styles.fill, {width: `${getProgressBetween(new Date(hero.start), new Date(hero.target), new Date(now))}%`, backgroundColor: danger ? ink : colors.accent}]} />
    </View>
    <View style={styles.footer}>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={[styles.caption, {color: muted, flex: 1}]}>{hero.footerLabel}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={[styles.footerTime, {color: ink}]}>{hero.footerTime}</Text>
    </View>
  </> : kind === "next" ? <>
    <Text allowFontScaling={!miniature} numberOfLines={1} style={styles.eyebrow}>{preview.label}</Text>
    <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.nextPrayer}>{preview.prayer}</Text>
    <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.nextTime}>{preview.time}</Text>
    <View style={styles.spacer} />
    <View style={styles.location}>
      <Ionicons name="location-outline" size={11} color={colors.heroMuted} />
      <Text allowFontScaling={!miniature} numberOfLines={1} style={[styles.caption, {color: colors.heroMuted, flex: 1}]}>{preview.location}</Text>
    </View>
  </> : kind === "summary" && summary ? <>
    <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.hijri}>{summary.hijri}</Text>
    <Text allowFontScaling={!miniature} numberOfLines={1} style={styles.caption}>{summary.date}</Text>
    <View style={styles.summaryPrayer}>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={styles.eyebrow}>{summary.label}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.title}>{summary.prayer}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.range}>{summary.range}</Text>
    </View>
    <View style={styles.stats}>
      {[{label: summary.sehri ? summary.sehriLabel : summary.sunriseLabel, value: summary.sehri || summary.sunrise, icon: "sunny-outline" as const},
        {label: summary.iftar ? summary.iftarLabel : summary.sunsetLabel, value: summary.iftar || summary.sunset, icon: "moon-outline" as const}].map(stat => <View key={stat.label} style={styles.stat}>
        <View style={styles.statHeading}><Ionicons name={stat.icon} size={12} color={colors.accent} /><Text allowFontScaling={!miniature} numberOfLines={1} style={styles.caption}>{stat.label}</Text></View>
        <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>{stat.value}</Text>
      </View>)}
    </View>
  </> : <>
    <View style={styles.tableHeading}>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={styles.tableTitle}>{summary?.timesLabel ?? "Prayer times"}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={styles.caption}>{summary?.date}</Text>
    </View>
    <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={styles.hijri}>{summary?.hijri}</Text>
    <View style={styles.rows}>{summary?.rows.map(row => <View key={row.name} style={[styles.row, row.active && styles.activeRow]}>
      <Text allowFontScaling={!miniature} numberOfLines={1} style={[styles.rowName, row.active && styles.activeText]}>{row.name}</Text>
      <Text allowFontScaling={!miniature} numberOfLines={1} adjustsFontSizeToFit style={[styles.rowTime, row.active && styles.activeText]}>{row.startTime ?? row.time}</Text>
    </View>)}</View>
    <View style={styles.location}><Ionicons name="location-outline" size={11} color={colors.inkSoft} /><Text allowFontScaling={!miniature} numberOfLines={1} style={styles.caption}>{preview.location}</Text></View>
  </>;
  return <View testID={`widget-preview-${kind}`} accessible accessibilityLabel={`${t("Widget preview")} · ${t(labels[kind])}`}
    style={[styles.card, kind === "next" ? styles.small : kind === "hero" ? styles.wide : kind === "summary" ? styles.summary : styles.large,
      miniature && {width: "100%", height: "100%", minHeight: 0, aspectRatio: undefined}]}>
    <WidgetBackdrop artwork={preview?.artwork ?? "serenity"} detailed={!decorative} danger={Boolean(danger)} empty={!preview || preview.empty} />
    <View style={[styles.content, kind === "next" && styles.smallContent]}>{content}</View>
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  card: {width: "100%", borderRadius: 24, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border},
  wide: {aspectRatio: 1.95}, small: {width: 172, height: 172, alignSelf: "center"}, summary: {minHeight: 202}, large: {minHeight: 306},
  content: {flex: 1, padding: 16, minWidth: 0}, smallContent: {padding: 15},
  empty: {flex: 1, gap: 8, justifyContent: "center"},
  heroHeader: {flexDirection: "row", alignItems: "baseline", gap: 8},
  title: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 21, lineHeight: 29, color: colors.ink, flexShrink: 1},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, lineHeight: 15, color: blendWidgetColor(colors.inkSoft, colors.ink, .12), flexShrink: 1},
  eyebrow: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 10, lineHeight: 15, color: colors.accent},
  countdown: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 34, lineHeight: 44, letterSpacing: -1, marginTop: 3, fontVariant: ["tabular-nums"]},
  window: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 10, lineHeight: 16, marginBottom: 8, fontVariant: ["tabular-nums"]},
  track: {height: 3, borderRadius: 2, overflow: "hidden", marginTop: "auto"}, fill: {height: "100%", borderRadius: 2},
  footer: {flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 9},
  footerTime: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 11, color: colors.ink, fontVariant: ["tabular-nums"]},
  nextPrayer: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 22, lineHeight: 31, color: colors.ink, marginTop: 3},
  nextTime: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 29, lineHeight: 40, letterSpacing: -1, color: colors.ink, fontVariant: ["tabular-nums"]},
  spacer: {flex: 1, minHeight: 8}, location: {flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6},
  hijri: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 11, lineHeight: 17, color: colors.accent},
  summaryPrayer: {marginTop: 10, gap: 1}, range: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, lineHeight: 18, color: blendWidgetColor(colors.inkSoft, colors.ink, .12), fontVariant: ["tabular-nums"]},
  stats: {flexDirection: "row", gap: 18, borderTopWidth: 1, borderColor: colors.border, paddingTop: 10, marginTop: 12},
  stat: {flex: 1, gap: 3}, statHeading: {flexDirection: "row", alignItems: "center", gap: 5},
  statValue: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15, lineHeight: 22, color: colors.ink, fontVariant: ["tabular-nums"]},
  tableHeading: {flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8},
  tableTitle: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 17, lineHeight: 25, color: colors.ink},
  rows: {marginTop: 10, gap: 3, flex: 1},
  row: {flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, minHeight: 35},
  activeRow: {backgroundColor: colors.selectedSurface}, activeText: {color: colors.accent, fontFamily: "BricolageGrotesque_700Bold"},
  rowName: {flex: 1, fontFamily: "BricolageGrotesque_500Medium", fontSize: 13, lineHeight: 20, color: colors.ink},
  rowTime: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 14, lineHeight: 21, color: colors.ink, maxWidth: "57%", fontVariant: ["tabular-nums"]},
}));
