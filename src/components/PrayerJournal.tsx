import { ActivityIndicator, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { createThemedStyles } from "../theme";
import type { PrayerName } from "../types";
import type { PrayerJournalController } from "../hooks/usePrayerJournal";
import { canRecordPrayer, journalCount } from "../services/prayerJournal";
import { AppButton } from "./ui";

export function PrayerCheck({journal, dateKey, prayer, start, now, timeZone}: {
  journal: PrayerJournalController; dateKey: string; prayer: PrayerName; start?: Date; now: Date; timeZone: string;
}) {
  const {colors, styles} = useStyles();
  const {t} = useI18n();
  const checked = !journal.days[dateKey]?.exempt && Boolean(journal.days[dateKey]?.[prayer]);
  const available = !journal.days[dateKey]?.exempt && !journal.days[dateKey]?.unreadable && canRecordPrayer(start, now, checked);
  const disabled = !journal.ready || journal.busyKey !== null || !available;
  const busy = journal.busyKey === `${dateKey}:${prayer}`;
  return <Pressable testID={`journal-check-${prayer.toLowerCase()}`} accessibilityRole="checkbox" accessibilityLabel={t("{prayer}, prayed", {prayer})}
    accessibilityHint={!journal.ready || journal.busyKey !== null ? undefined : checked ? "Tap to undo" : !available ? "You can record this prayer after it begins." : "Tap to mark as prayed"}
    accessibilityState={{checked, disabled, busy}} disabled={disabled} onPress={() => journal.toggle(dateKey, prayer, start, now, timeZone)}
    style={[styles.check, disabled && !checked && styles.disabled]}>
    {busy ? <ActivityIndicator size="small" color={colors.accent} /> : <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} size={27} color={checked ? colors.accent : colors.inkSoft} />}
  </Pressable>;
}

export function JournalCount({journal, dateKey}: {journal: PrayerJournalController; dateKey: string}) {
  const {styles} = useStyles();
  const {t} = useI18n();
  return <Text testID="journal-count" accessibilityLiveRegion="polite" style={styles.headerCount}>
    {journal.ready ? journal.days[dateKey]?.exempt ? "Exempt" : t("{count} of 5 recorded", {count: journalCount(journal.days[dateKey])}) : journal.loadIssue ? "Your journal could not be loaded." : "Loading your journal…"}
  </Text>;
}

export function JournalSummary({journal, dateKey, showCount = true}: {journal: PrayerJournalController; dateKey: string; showCount?: boolean}) {
  const {styles} = useStyles();
  const {t} = useI18n();
  const count = journalCount(journal.days[dateKey]);
  if (!showCount && journal.ready && !journal.loadIssue && !journal.saveIssue && !journal.recoveryIssue) return null;
  return <View style={styles.summary} testID="journal-summary">
    {!showCount && (!journal.ready || journal.loadIssue) ? <Text accessibilityLiveRegion="polite" style={styles.summaryText}>{journal.loadIssue ? "Your journal could not be loaded." : "Loading your journal…"}</Text> : null}
    {showCount ? <Text accessibilityLiveRegion="polite" style={styles.summaryText}>{journal.ready ? journal.days[dateKey]?.exempt ? "Exempt" : t("{count} of 5 recorded", {count}) : journal.loadIssue ? "Your journal could not be loaded." : "Loading your journal…"}</Text> : null}
    {showCount && journal.ready && count === 5 ? <Text style={styles.complete}>A moment for every prayer.</Text> : null}
    {journal.recoveryIssue ? <Text accessibilityLiveRegion="polite" style={styles.issueText}>Some saved entries could not be read. Your other records are available; the originals are preserved.</Text> : null}
    {journal.loadIssue ? <AppButton label="Try again" variant="quiet" onPress={journal.retryLoad} /> : null}
    {journal.saveIssue ? <View style={styles.issue}><Text style={styles.issueText}>Your entry could not be saved.</Text><AppButton label="Try again" variant="quiet" onPress={journal.retrySave} /></View> : null}
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  check: {width: 44, height: 44, alignItems: "center", justifyContent: "center", marginEnd: 4, flexShrink: 0},
  disabled: {opacity: .45},
  summary: {paddingHorizontal: 18, paddingBottom: 12, gap: 5},
  headerCount: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, color: colors.inkSoft, flexShrink: 1, textAlign: "right"},
  summaryText: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, color: colors.inkSoft},
  complete: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, color: colors.accent},
  issue: {gap: 8},issueText: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, color: colors.danger},
}));
