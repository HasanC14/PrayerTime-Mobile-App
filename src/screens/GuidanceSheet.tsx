import { useI18n } from "../i18n/context";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SheetHeader } from "../components/SheetHeader";
import { BottomSheetModal } from "../components/BottomSheetModal";
import { createThemedStyles, radii, shadows, spacing } from "../theme";
import type { PrayerDay, TimeFormat } from "../types";
import { formatPrayerTimeRange, getPrayerGuidanceWindows } from "../utils/time";

export function GuidanceSheet({
  visible,
  onClose,
  day,
  timeFormat
}: {
  visible: boolean;
  onClose: () => void;
  day?: PrayerDay;
  timeFormat: TimeFormat;
}) {
  const { colors, styles } = useStyles();
  const { language } = useI18n();
  const insets = useSafeAreaInsets();
  if (!day) return null;

  const icons = {
    sunrise: "sunny-outline",
    "solar-noon": "sunny",
    sunset: "cloudy-night-outline"
  } as const;
  const items = getPrayerGuidanceWindows(day).map((window) => ({
    ...window,
    icon: icons[window.key]
  }));

  return (
    <BottomSheetModal
      visible={visible}
      closeLabel="Close prayer-time guidance"
      onClose={onClose}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}
    >
        <View accessibilityViewIsModal style={{ flexShrink: 1 }}>
          <SheetHeader title="Prohibited prayer times" onClose={onClose} />

          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={22} color={colors.inkSoft} />
              <Text style={styles.noticeText}>
                These times are a guide. Follow your local mosque if its guidance is different.
              </Text>
            </View>
            {items.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon} size={22} color={colors.inkSoft} />
                </View>
                <View style={styles.itemCopy}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemTime}>
                      {formatPrayerTimeRange(
                        item.start,
                        item.end,
                        timeFormat,
                        day.timeZone, language,
                      )}
                    </Text>
                  </View>
                  <Text style={styles.itemNote}>{item.message}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
    </BottomSheetModal>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  sheet: {
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: "88%",
    maxWidth: 620,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    width: "100%",
    ...shadows.card
  },
  handle: { alignSelf: "center", backgroundColor: colors.sheetHandle, borderRadius: radii.pill, height: 5, marginBottom: spacing.lg, width: 44 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.lg },
  titleBlock: { flex: 1, paddingEnd: spacing.md },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 23, fontWeight: "800", letterSpacing: -0.4 },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginTop: 2 },
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  notice: {
    alignItems: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg
  },
  noticeText: { color: colors.inkSoft, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19 },
  item: {
    alignItems: "flex-start",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.lg
  },
  itemIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    height: 42,
    justifyContent: "center",
    marginEnd: spacing.md,
    width: 42
  },
  itemCopy: { flex: 1 },
  itemHeader: { alignItems: "flex-start" },
  itemTitle: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 16, fontWeight: "700" },
  itemTime: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 15, fontVariant: ["tabular-nums"], fontWeight: "800", marginTop: 3 },
  itemNote: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, lineHeight: 19, marginTop: spacing.sm }
}));
