import { useTextScale } from "../typography";
import { weekdayShort } from "../i18n/translate";
import { useI18n } from "../i18n/context";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Pressable, Text } from "../i18n/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton, ScreenHeader, SurfaceCard } from "../components/ui";
import { selectionFeedback } from "../utils/feedback";
import { DEFAULT_SETTINGS, DEFAULT_PRAYER_ALARMS, PRAYER_EVENT_META } from "../constants/settings";
import { getMonthFromDateKey, getMonthGrid } from "../services/calendar";
import { getPrayerPeriodsForDate } from "../services/prayerPeriods";
import { addDaysToDateKey, calculatePrayerDay, getDateKeyInTimeZone } from "../services/prayerTimes";
import { createThemedStyles, radii, spacing } from "../theme";
import { PRAYER_EVENTS } from "../types";
import type { AppLocation, AppSettings, PrayerDay } from "../types";
import { formatPrayerTime, formatPrayerTimeRange } from "../utils/time";

const WEEKDAYS = [
  { short: "M", label: "Monday" },
  { short: "T", label: "Tuesday" },
  { short: "W", label: "Wednesday" },
  { short: "T", label: "Thursday" },
  { short: "F", label: "Friday" },
  { short: "S", label: "Saturday" },
  { short: "S", label: "Sunday" }
];

export function CalendarScreen({
  location,
  settings,
  now
}: {
  location: AppLocation;
  settings: AppSettings;
  now: Date;
}) {
  const { colors, styles } = useStyles();
  const { language, locale, isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const compact = width < 360 || fontScale * textScale > 1.2 || language === "bn";
  const todayKey = getDateKeyInTimeZone(now, location.timeZone);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [visibleMonth, setVisibleMonth] = useState(() => getMonthFromDateKey(todayKey));
  const sessionKey = `${location.timeZone}|${todayKey}`;
  const [calendarSession, setCalendarSession] = useState(sessionKey);

  if (calendarSession !== sessionKey) {
    setCalendarSession(sessionKey);
    setSelectedKey(todayKey);
    setVisibleMonth(getMonthFromDateKey(todayKey));
  }

  const cells = useMemo(
    () => getMonthGrid(visibleMonth.year, visibleMonth.monthIndex),
    [visibleMonth]
  );

  const calculationSettings = useMemo<AppSettings>(
    () => ({
      language: "en",
      textScale: 1,
      method: settings.method,
      school: settings.school,
      midnightMode: settings.midnightMode,
      hijriAdjustmentDays: settings.hijriAdjustmentDays,
      latitudeAdjustmentMethod: settings.latitudeAdjustmentMethod,
      timeFormat: "12h",
      ramadanMode: "off",
      themeMode: "system",
      heroArtwork: DEFAULT_SETTINGS.heroArtwork,
      notificationsEnabled: false,
      prayerStartNotificationsEnabled: false,
      prayerTrackingEnabled: false,
      alarmLeadMinutes: DEFAULT_SETTINGS.alarmLeadMinutes,
      prayerAlarmMinutes: DEFAULT_PRAYER_ALARMS
    }),
    [settings.latitudeAdjustmentMethod, settings.method, settings.midnightMode, settings.school, settings.hijriAdjustmentDays]
  );

  const calculatedDays = useMemo(() => {
    const map = new Map<string, PrayerDay>();
    for (const cell of cells) {
      try {
        map.set(cell.dateKey, calculatePrayerDay(location, calculationSettings, cell.dateKey));
      } catch {
        // Individual unavailable days remain selectable and show an error below.
      }
    }
    return map;
  }, [calculationSettings, cells, location]);

  const selectedDay = calculatedDays.get(selectedKey);
  const selectedPrayerPeriods = useMemo(() => {
    if (!selectedDay) return new Map();
    const nextKey = addDaysToDateKey(selectedKey, 1);
    let nextDay = calculatedDays.get(nextKey);
    if (!nextDay) {
      try {
        nextDay = calculatePrayerDay(location, calculationSettings, nextKey);
      } catch {
        // Isha can still show an unavailable end if the following day cannot be calculated.
      }
    }
    return getPrayerPeriodsForDate(nextDay ? [selectedDay, nextDay] : [selectedDay], selectedKey);
  }, [calculatedDays, calculationSettings, location, selectedDay, selectedKey]);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(visibleMonth.year, visibleMonth.monthIndex, 1, 12))
  );

  const moveMonth = (offset: number) => {
    selectionFeedback();
    const next = new Date(Date.UTC(visibleMonth.year, visibleMonth.monthIndex + offset, 1, 12));
    const year = next.getUTCFullYear();
    const monthIndex = next.getUTCMonth();
    setVisibleMonth({ year, monthIndex });
    setSelectedKey(`${year}-${String(monthIndex + 1).padStart(2, "0")}-01`);
  };

  const returnToToday = () => {
    setSelectedKey(todayKey);
    setVisibleMonth(getMonthFromDateKey(todayKey));
  };

  return (
    <View style={styles.screen}>
    <ScreenHeader title="Calendar" subtitle={location.name} action={
      <Pressable accessibilityRole="button" accessibilityLabel="Return to today" onPress={returnToToday} style={styles.todayButton}>
        <Text style={styles.todayButtonText}>Today</Text>
      </Pressable>
    } />
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: spacing.xs, paddingBottom: Math.max(insets.bottom, spacing.xxl) }
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <SurfaceCard style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <IconButton icon={isRTL ? "chevron-forward" : "chevron-back"} label="Previous month" onPress={() => moveMonth(-1)} />
            <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.monthTitle}>{monthLabel}</Text>
            <IconButton icon={isRTL ? "chevron-back" : "chevron-forward"} label="Next month" onPress={() => moveMonth(1)} />
          </View>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text accessibilityLabel={day.label} maxFontSizeMultiplier={1.3} key={day.label} style={styles.weekday}>
                {weekdayShort(day.label, language)}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {cells.map((cell) => {
              const selected = cell.dateKey === selectedKey;
              const isToday = cell.dateKey === todayKey;
              const hijriDay = calculatedDays.get(cell.dateKey)?.hijriDate.day;
              return (
                <Pressable
                  key={cell.dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`${new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${cell.dateKey}T12:00:00Z`))}${isToday ? `, ${t("Today")}` : ""}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    selectionFeedback();
                    setSelectedKey(cell.dateKey);
                    if (!cell.inCurrentMonth) setVisibleMonth(getMonthFromDateKey(cell.dateKey));
                  }}
                  style={({ pressed }) => [styles.cell, pressed && styles.cellPressed]}
                >
                  <View style={[styles.dayCircle, selected && styles.dayCircleSelected, isToday && !selected && styles.dayCircleToday]}>
                    <Text maxFontSizeMultiplier={1.3} style={[styles.dayNumber, !cell.inCurrentMonth && styles.dayNumberMuted, selected && styles.dayNumberSelected]}>
                      {cell.day}
                    </Text>
                  </View>
                  <Text maxFontSizeMultiplier={1.3} style={[styles.hijriDay, !cell.inCurrentMonth && styles.hijriDayMuted]}>{hijriDay || ""}</Text>
                </Pressable>
              );
            })}
          </View>
        </SurfaceCard>

        <View style={styles.selectedHeader}>
          <View>
            <Text style={styles.selectedDate}>
              {new Intl.DateTimeFormat(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
                timeZone: "UTC"
              }).format(new Date(`${selectedKey}T12:00:00Z`))}
            </Text>
            {selectedDay ? (
              <Text style={styles.selectedHijri}>
                {selectedDay.hijriDate.day} {selectedDay.hijriDate.month} {selectedDay.hijriDate.year} AH
              </Text>
            ) : null}
          </View>
        </View>

        <SurfaceCard style={styles.scheduleCard}>
          {selectedDay ? (
            PRAYER_EVENTS.map((name, index) => {
              const meta = PRAYER_EVENT_META[name];
              const period = name === "Sunrise" ? undefined : selectedPrayerPeriods.get(name);
              return (
                <View key={name} style={[styles.prayerRow, compact && styles.prayerRowCompact, index < PRAYER_EVENTS.length - 1 && styles.prayerBorder]}>
                  <View style={styles.prayerIcon}>
                    <Ionicons name={meta.icon} size={19} color={colors.accent} />
                  </View>
                  <View style={styles.prayerCopy}>
                    <Text style={styles.prayerName}>{name}</Text>
                    {name === "Sunrise" ? <Text style={styles.eventText}>Solar event</Text> : null}
                    {compact ? <Text style={[styles.prayerTime, styles.compactTime]}>{name === "Sunrise"
                      ? formatPrayerTime(selectedDay.instants.Sunrise, settings.timeFormat, location.timeZone, language)
                      : formatPrayerTimeRange(period?.start, period?.end, settings.timeFormat, location.timeZone, language)}</Text> : null}
                  </View>
                  {compact ? null : name === "Sunrise" ? (
                    <View style={styles.prayerTimeRange}>
                      <Text style={styles.prayerTimeLabel}>At</Text>
                      <Text style={styles.prayerTime}>
                        {formatPrayerTime(selectedDay.instants.Sunrise, settings.timeFormat, location.timeZone, language)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.prayerTimeRange}>
                      <Text numberOfLines={1} style={styles.prayerTime}>
                        {formatPrayerTimeRange(
                          period?.start,
                          period?.end,
                          settings.timeFormat,
                          location.timeZone, language,
                        )}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.unavailable}>
              <Ionicons name="alert-circle-outline" size={22} color={colors.warningText} />
              <Text style={styles.unavailableText}>Prayer times could not be calculated for this day.</Text>
            </View>
          )}
        </SurfaceCard>
      </View>
    </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  page: { alignSelf: "center", maxWidth: 620, width: "100%" },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.xl },
  title: { color: colors.ink, fontFamily: "BricolageGrotesque_800ExtraBold", fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
  subtitle: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13, marginTop: 3 },
  todayButton: { alignItems: "center", backgroundColor: colors.accentSurface, borderRadius: radii.pill, justifyContent: "center", minHeight: 44, paddingHorizontal: spacing.lg },
  todayButtonText: { color: colors.accent, fontFamily: "BricolageGrotesque_700Bold", fontSize: 13, fontWeight: "700" },
  calendarCard: { padding: spacing.md },
  monthHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  monthTitle: { flex: 1, textAlign: "center", color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 17, fontWeight: "700" },
  weekRow: { flexDirection: "row", marginBottom: spacing.xs },
  weekday: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_700Bold", fontSize: 11, fontWeight: "700", textAlign: "center", width: "14.2857%" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { alignItems: "center", minHeight: 54, paddingVertical: 4, justifyContent: "center", width: "14.2857%" },
  cellPressed: { opacity: 0.6 },
  dayCircle: { alignItems: "center", borderRadius: 16, minHeight: 32, justifyContent: "center", minWidth: 32 },
  dayCircleSelected: { backgroundColor: colors.accent },
  dayCircleToday: { borderColor: colors.accent, borderWidth: 1 },
  dayNumber: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 14, fontVariant: ["tabular-nums"], fontWeight: "600" },
  dayNumberMuted: { color: colors.muted },
  dayNumberSelected: { color: colors.onAccent, fontFamily: "BricolageGrotesque_800ExtraBold", fontWeight: "800" },
  hijriDay: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 10, minHeight: 13, marginTop: 2 },
  hijriDayMuted: { color: colors.mutedStrong },
  selectedHeader: { marginBottom: spacing.md, marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  selectedDate: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 20, fontWeight: "700" },
  selectedHijri: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 12, marginTop: 2 },
  scheduleCard: { overflow: "hidden" },
  prayerRow: { alignItems: "center", flexDirection: "row", minHeight: 66, paddingHorizontal: spacing.lg },
  prayerRowCompact: {paddingVertical: 14},
  prayerBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  prayerIcon: { alignItems: "center", height: 32, justifyContent: "center", marginEnd: spacing.md, width: 32 },
  prayerCopy: { flex: 1, minWidth: 0 },
  compactTime: {marginTop: 8, fontFamily: "BricolageGrotesque_500Medium", fontWeight: "500", fontSize: 14, lineHeight: 25},
  prayerName: { color: colors.ink, fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 14, fontWeight: "600" },
  eventText: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_400Regular", fontSize: 9, marginTop: 1 },
  prayerTimeRange: { alignItems: "flex-end", minWidth: 112 },
  prayerTimeLabel: { color: colors.inkSoft, fontFamily: "BricolageGrotesque_500Medium", fontSize: 9 },
  prayerTime: { color: colors.ink, fontFamily: "BricolageGrotesque_700Bold", fontSize: 13, fontVariant: ["tabular-nums"], fontWeight: "700" },
  unavailable: { alignItems: "center", flexDirection: "row", gap: spacing.sm, padding: spacing.lg },
  unavailableText: { color: colors.warningText, flex: 1, fontFamily: "BricolageGrotesque_400Regular", fontSize: 13 }
}));
