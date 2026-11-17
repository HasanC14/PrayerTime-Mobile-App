import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { useTextScale } from "../typography";
import { createThemedStyles } from "../theme";
import { formatPrayerTime, formatPrayerTimeRange, getPrayerGuidanceWindows, type PrayerGuidanceWindow } from "../utils/time";
import type { PrayerDay, TimeFormat } from "../types";
import { IconButton, SurfaceCard } from "./ui";

export function ProhibitedTimesCard({ day, timeFormat, active, onOpenGuidance }: {
  day: PrayerDay; timeFormat: TimeFormat; active: PrayerGuidanceWindow | null; onOpenGuidance: () => void;
}) {
  const { styles } = useStyles();
  const { language, t } = useI18n();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const rows = width < 360 || textScale * fontScale > 1.15;
  return <View testID="prohibited-times"><SurfaceCard style={styles.card}>
    <View style={styles.header}>
      <Text accessibilityRole="header" style={styles.heading}>Prohibited times</Text>
      <IconButton icon="information-circle-outline" label="About prohibited times" onPress={onOpenGuidance} variant="plain" />
    </View>
    <View style={[styles.grid, rows && styles.rows]}>
      {getPrayerGuidanceWindows(day).map(window => {
        const selected = window.key === active?.key;
        const start = formatPrayerTime(window.start, timeFormat, day.timeZone, language);
        const end = formatPrayerTime(window.end, timeFormat, day.timeZone, language);
        return <View key={window.key} testID={`prohibited-${window.key}`} accessible accessibilityLabel={`${t(window.title)}, ${start} – ${end}${selected ? `, ${t("Active now")}` : ""}`} style={[styles.item, rows && styles.itemRow, selected && styles.active]}>
          <Text style={[styles.label, rows && styles.rowLabel]}>{window.title}</Text>
          <Text localize={false} numberOfLines={rows ? undefined : 1} style={[styles.time, rows && styles.rowTime]}>
            {formatPrayerTimeRange(window.start, window.end, timeFormat, day.timeZone, language, {omitDayPeriod: true})}
          </Text>
        </View>;
      })}
    </View>
  </SurfaceCard></View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  card: { padding: 12, marginBottom: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingStart: 4, gap: 8 },
  heading: { flex: 1, fontFamily: "BricolageGrotesque_700Bold", fontSize: 15, color: colors.ink },
  grid: { flexDirection: "row", gap: 8, marginTop: 8 },
  rows: { flexDirection: "column" },
  item: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, borderRadius: 12, borderWidth: 1, borderColor: "transparent", paddingVertical: 14, paddingHorizontal: 4, alignItems: "center", gap: 6, backgroundColor: colors.surfaceMuted },
  itemRow: { flexGrow: 0, flexShrink: 0, flexBasis: "auto", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingHorizontal: 14 },
  active: { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong },
  label: { fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, lineHeight: 20, color: colors.inkSoft },
  rowLabel: {flexShrink: 1},
  time: { fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, lineHeight: 20, color: colors.ink, fontVariant: ["tabular-nums"], maxWidth: "100%" },
  rowTime: {fontSize: 13, lineHeight: 22, flexShrink: 1, textAlign: "right"},
}));
