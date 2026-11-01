import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import type { PrayerJournalController } from "../hooks/usePrayerJournal";
import { getJournalPeriod, getJournalPeriodSummary, getJournalDayStatus, moveJournalPeriod, type JournalPeriod } from "../services/journalOverview";
import { WeeklyReflection } from "./WeeklyReflection";
import { journalWeek } from "../services/prayerJournal";
import { calculatePrayerDay } from "../services/prayerTimes";
import type { AppLocation, AppSettings, PrayerDay } from "../types";
import { createThemedStyles } from "../theme";
import { IconButton, SegmentedControl, SurfaceCard } from "./ui";

const PERIOD_OPTIONS = [{id: "week", name: "Week"}, {id: "month", name: "Month"}] as const;
const STATUS_LABELS = {recorded: "Recorded", "not-recorded": "Not recorded", missed: "Missed", exempt: "Exempt", upcoming: "Upcoming", unavailable: "Time unavailable", "not-tracked": "Before tracking"};

export function JournalHistory({journal, location, settings, now, activeKey, selectedKey, onSelect, onReturnToday}: {
  journal: PrayerJournalController; location: AppLocation; settings: AppSettings; now: Date;
  activeKey: string; selectedKey: string; onSelect: (key: string) => void; onReturnToday: () => void;
}) {
  const {colors, styles} = useStyles();
  const {locale, isRTL, t} = useI18n();
  const [period, setPeriod] = useState<JournalPeriod>("week");
  const week = useMemo(() => journalWeek(selectedKey), [selectedKey]);
  const weekDays = useMemo(() => {
    const days = new Map<string, PrayerDay>();
    if (period !== "week") return days;
    for (const key of week) {
      try {days.set(key, calculatePrayerDay(location, settings, key));}
      catch { /* Existing entries remain visible if a calculation is unavailable. */ }
    }
    return days;
  }, [location, period, settings, week]);
  const summary = getJournalPeriodSummary(journal.days, selectedKey, period, activeKey, journal.startedOn);
  const currentStart = getJournalPeriod(activeKey, period).start;
  const fraction = (recorded: number, total: number) => {
    // Arabic digits separated by spaces need strong LTR marks as well as an
    // isolate; an isolate alone still lets the two number groups swap places.
    const value = t("{recorded} / {total}", {
      recorded: isRTL ? `\u200E${recorded}\u200E` : recorded,
      total: isRTL ? `\u200E${total}\u200E` : total,
    });
    return isRTL ? `\u2066${value}\u2069` : value;
  };
  const dateLabel = (key: string, full = false) => new Intl.DateTimeFormat(locale,
    full ? {dateStyle: "full", timeZone: "UTC"} : {month: "short", day: "numeric", timeZone: "UTC"}).format(new Date(`${key}T12:00:00Z`));
  const periodLabel = period === "week" ? `${dateLabel(summary.start)} – ${dateLabel(summary.end)}`
    : new Intl.DateTimeFormat(locale, {month: "long", year: "numeric", timeZone: "UTC"}).format(new Date(`${summary.start}T12:00:00Z`));
  function move(offset: number) {
    const target = moveJournalPeriod(selectedKey, period, offset);
    onSelect(target > activeKey ? activeKey : target);
  }

  return <View style={styles.stack}><SurfaceCard style={styles.card}>
    <SegmentedControl label="Journal view" options={PERIOD_OPTIONS} value={period} onChange={value => setPeriod(value as JournalPeriod)} />
    <View style={styles.heading}>
      <View style={styles.headingCopy}>
        <Text style={styles.title}>{period === "week" ? "Your week" : "Your month"}</Text>
        <Text localize={false} style={styles.caption}>{periodLabel}</Text>
      </View>
      <IconButton icon={isRTL ? "chevron-forward" : "chevron-back"} label={period === "week" ? "Previous week" : "Previous month"} variant="plain" onPress={() => move(-1)} />
      <IconButton icon={isRTL ? "chevron-back" : "chevron-forward"} label={period === "week" ? "Next week" : "Next month"} variant="plain" disabled={summary.start >= currentStart} onPress={() => move(1)} />
    </View>
    <View style={styles.overall} testID="journal-period-summary">
      {summary.total ? <>
        <Text localize={false} style={styles.ratio}>{t("{ratio} prayers recorded", {ratio: fraction(summary.recorded, summary.total)})}</Text>
        {summary.recorded > 0 || summary.missed > 0 ? <Text style={styles.caption}>{t("{count} missed", {count: summary.missed})}</Text>
          : <Text style={styles.caption}>No prayers logged in this period.</Text>}
        {summary.unlogged > 0 ? <Text style={styles.caption}>{t("{count} without activity", {count: summary.unlogged})}</Text> : null}
        <Text style={styles.coverage}>{t("Completed days: {start} – {end}", {start: dateLabel(summary.firstIncluded!), end: dateLabel(summary.lastIncluded!)})}</Text>
      </> : <Text style={styles.caption}>{summary.exemptDays > 0 ? "Exempt days are left out of your prayer totals." : summary.end < summary.trackingStart ? "This period is before tracking began." : "Your summary begins after your first completed day."}</Text>}
    </View>

    {summary.exemptDays > 0 ? <Text style={styles.caption}>{t("{count} exempt days excluded", {count: summary.exemptDays})}</Text> : null}
    {period === "week" ? <>
      <View style={styles.matrix} testID="journal-week-matrix">
        <View style={styles.matrixRow}>
          <View style={styles.rowLabel} />
          {week.map(key => <View key={key} style={[styles.cell, key === selectedKey && styles.selectedColumn]}>
            <Text localize={false} style={styles.weekday}>{new Intl.DateTimeFormat(locale, {weekday: "narrow", timeZone: "UTC"}).format(new Date(`${key}T12:00:00Z`))}</Text>
            <Text style={styles.dayNumber}>{new Date(`${key}T12:00:00Z`).getUTCDate()}</Text>
          </View>)}
        </View>
        {summary.prayers.map(row => <View key={row.prayer} style={styles.matrixRow}>
          <View style={styles.rowLabel}>
            <Text style={styles.prayer}>{row.prayer}</Text>
            <Text localize={false} style={styles.weekCount}>{summary.total ? fraction(row.recorded, row.total) : "—"}</Text>
          </View>
          {week.map(key => {
            const recorded = Boolean(journal.days[key]?.[row.prayer]);
            const status = key < summary.trackingStart && !recorded ? "not-tracked" : getJournalDayStatus(journal.days, key, row.prayer, weekDays.get(key)?.instants[row.prayer], now, activeKey, summary.trackingStart);
            return <View key={key} accessible accessibilityLabel={t("{prayer}, {date}: {status}", {prayer: row.prayer, date: dateLabel(key, true), status: STATUS_LABELS[status]})}
              style={[styles.cell, key === selectedKey && styles.selectedColumn]} testID={`journal-cell-${key}-${row.prayer.toLowerCase()}`}>
              {status === "recorded" ? <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
                : status === "missed" ? <Ionicons name="close-circle-outline" size={16} color={colors.inkSoft} />
                : status === "exempt" ? <Text localize={false} style={styles.placeholder}>–</Text>
                : status === "not-recorded" ? <View style={styles.emptyCircle} />
                  : <Text localize={false} style={styles.placeholder}>{status === "not-tracked" || status === "unavailable" ? "–" : "·"}</Text>}
            </View>;
          })}
        </View>)}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}><Ionicons name="checkmark-circle" size={13} color={colors.accent} /><Text style={styles.legendText}>Recorded</Text></View>
        <View style={styles.legendItem}><Ionicons name="close-circle-outline" size={13} color={colors.inkSoft} /><Text style={styles.legendText}>Missed</Text></View>
        {week.some(key => journal.days[key]?.exempt) ? <View style={styles.legendItem}><Text localize={false} style={styles.placeholder}>–</Text><Text style={styles.legendText}>Exempt</Text></View> : null}
        <View style={styles.legendItem}><View style={styles.legendCircle} /><Text style={styles.legendText}>Not recorded</Text></View>
        <View style={styles.legendItem}><Text localize={false} style={styles.placeholder}>·</Text><Text style={styles.legendText}>Upcoming</Text></View>
        {week.some(key => key < summary.trackingStart) ? <View style={styles.legendItem}><Text localize={false} style={styles.placeholder}>–</Text><Text style={styles.legendText}>Before tracking</Text></View> : null}
      </View>
    </> : summary.total ? <View testID="journal-month-breakdown">
      {summary.prayers.map(row => <View key={row.prayer} testID={`journal-month-${row.prayer.toLowerCase()}`} style={styles.monthRow}
        accessible accessibilityRole="progressbar" accessibilityValue={{min: 0, max: row.total, now: row.recorded}}
        aria-valuemin={0} aria-valuemax={row.total} aria-valuenow={row.recorded}
        accessibilityLabel={t("{prayer}: {recorded} of {total} recorded, {missed} missed, {unlogged} without activity", {prayer: row.prayer, recorded: row.recorded, total: row.total, missed: row.missed, unlogged: row.unlogged})}>
        <View style={styles.monthHeading}>
          <Text style={styles.monthPrayer}>{row.prayer}</Text>
          <Text localize={false} style={styles.monthCount}>{fraction(row.recorded, row.total)}</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, {width: `${row.progress}%`}]} /></View>
        <Text style={styles.remaining}>{t("{count} missed", {count: row.missed})}</Text>
        {row.unlogged > 0 ? <Text style={styles.remaining}>{t("{count} without activity", {count: row.unlogged})}</Text> : null}
      </View>)}
    </View> : null}
    <Text style={styles.note}>Unchecked prayers on completed days count as missed in weeks with recorded prayers. You can update past entries.</Text>
    <Text style={styles.note}>Weeks without entries are left unassessed. Today’s entries count when the day is complete.</Text>
    {selectedKey !== activeKey ? <Pressable accessibilityRole="button" accessibilityLabel="Return to today" onPress={onReturnToday} style={styles.returnToday}><Text style={styles.returnText}>Return to today</Text></Pressable> : null}
  </SurfaceCard>
    {period === "week" ? <WeeklyReflection journal={journal} anchor={selectedKey} activeKey={activeKey} /> : null}
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  stack: {gap: 16},
  card: {padding: 12},
  heading: {flexDirection: "row", alignItems: "center", gap: 2, paddingTop: 16, paddingBottom: 12},
  headingCopy: {flex: 1, minWidth: 0, gap: 4, paddingStart: 4},
  title: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 16, color: colors.ink},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft},
  overall: {paddingHorizontal: 4, gap: 6, paddingBottom: 16},
  ratio: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 18, color: colors.accent},
  coverage: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, color: colors.inkSoft},
  matrix: {gap: 2},
  matrixRow: {flexDirection: "row", alignItems: "center", minHeight: 44},
  rowLabel: {width: "32%", paddingEnd: 4, paddingVertical: 6, gap: 3},
  prayer: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, color: colors.ink},
  weekCount: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, color: colors.inkSoft},
  cell: {flex: 1, minWidth: 0, minHeight: 36, alignItems: "center", justifyContent: "center", alignSelf: "stretch", gap: 4, paddingVertical: 5, borderRadius: 6},
  selectedColumn: {backgroundColor: colors.accentSurface},
  weekday: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 9, color: colors.inkSoft, textAlign: "center"},
  dayNumber: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 11, color: colors.ink, textAlign: "center"},
  emptyCircle: {width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: colors.inkSoft},
  placeholder: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 17, color: colors.inkSoft, textAlign: "center"},
  legend: {flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 8, paddingTop: 12, paddingHorizontal: 4},
  legendItem: {flexDirection: "row", alignItems: "center", gap: 5},
  legendText: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, color: colors.inkSoft},
  legendCircle: {width: 11, height: 11, borderRadius: 6, borderWidth: 1.3, borderColor: colors.inkSoft},
  monthRow: {paddingHorizontal: 4, paddingVertical: 12, gap: 8},
  monthHeading: {flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8},
  monthPrayer: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15, color: colors.ink},
  monthCount: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15, color: colors.accent},
  progressTrack: {height: 5, backgroundColor: colors.accentSurface, borderRadius: 4, overflow: "hidden", alignItems: "flex-start"},
  progressFill: {height: 5, backgroundColor: colors.accent, borderRadius: 4},
  remaining: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft},
  note: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, color: colors.inkSoft, paddingTop: 14, paddingHorizontal: 4},
  returnToday: {minHeight: 44, justifyContent: "center", alignItems: "center", marginTop: 12, borderRadius: 12, backgroundColor: colors.accentSurface},
  returnText: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 12, color: colors.accent},
}));
