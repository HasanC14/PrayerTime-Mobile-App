import { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, Text } from "../i18n/native";
import { useI18n } from "../i18n/context";
import { AppButton, IconButton, ScreenHeader, SurfaceCard } from "../components/ui";
import { JournalSummary, PrayerCheck } from "../components/PrayerJournal";
import type { PrayerJournalController } from "../hooks/usePrayerJournal";
import { getJournalDateKey, getJournalDayStatus, getJournalTrackingStart, type JournalStatus } from "../services/journalOverview";
import { JournalHistory } from "../components/JournalHistory";
import { addDaysToDateKey, calculatePrayerDay, getDateKeyInTimeZone } from "../services/prayerTimes";
import { PRAYER_NAMES, type AppLocation, type AppSettings, type PrayerDay } from "../types";
import { createThemedStyles } from "../theme";
import { selectionFeedback } from "../utils/feedback";
import { formatPrayerTime } from "../utils/time";

const STATUS_LABELS: Record<JournalStatus, string> = {
  recorded: "Recorded", "not-recorded": "Not recorded", missed: "Missed", exempt: "Exempt", upcoming: "Upcoming", unavailable: "Time unavailable",
};

export function JournalScreen({location, settings, calendar, now, journal, onEnable, onOpenSettings}: {
  location: AppLocation;
  settings: AppSettings;
  calendar: PrayerDay[];
  now: Date;
  journal: PrayerJournalController;
  onEnable: () => void;
  onOpenSettings: () => void;
}) {
  const {colors, styles} = useStyles();
  const {locale, language, isRTL} = useI18n();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollView>(null);
  const activeKey = getJournalDateKey(now, calendar, location.timeZone);
  const civilDateKey = getDateKeyInTimeZone(now, location.timeZone);
  const [selectedKey, setSelectedKey] = useState(activeKey);
  const [sessionKey, setSessionKey] = useState(`${location.timeZone}|${activeKey}`);
  if (sessionKey !== `${location.timeZone}|${activeKey}`) {
    setSessionKey(`${location.timeZone}|${activeKey}`);
    setSelectedKey(activeKey);
  }
  const selectedDay = useMemo(() => {
    if (!settings.prayerTrackingEnabled) return undefined;
    try {return calculatePrayerDay(location, settings, selectedKey);}
    catch {return undefined;}
  }, [location, selectedKey, settings]);
  const trackingStart = getJournalTrackingStart(journal.days, journal.startedOn, activeKey);
  const dateLabel = (key: string, full = false) => new Intl.DateTimeFormat(locale,
    full ? {weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC"}
      : {month: "short", day: "numeric", timeZone: "UTC"}).format(new Date(`${key}T12:00:00Z`));
  function select(key: string) {selectionFeedback();setSelectedKey(key);}

  return <View style={styles.screen} testID="journal-screen">
    <ScreenHeader title="Journal" action={
      <IconButton icon="settings-outline" label="Settings" variant="plain" onPress={onOpenSettings} />
    } />
    <ScrollView ref={scroll} testID="journal-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, {paddingBottom: Math.max(insets.bottom, 24)}]}>
      <View style={styles.page}>
        {!settings.prayerTrackingEnabled ? <SurfaceCard style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="book-outline" size={30} color={colors.accent} /></View>
          <Text style={styles.emptyTitle}>A little space to reflect</Text>
          <Text style={styles.body}>Record your prayers and gently notice the patterns in your days.</Text>
          <AppButton label="Start your journal" onPress={onEnable} />
          <Text style={styles.caption}>Your journal stays on this device</Text>
        </SurfaceCard> : <>
          <SurfaceCard style={styles.dayCard}>
            <View style={styles.dayNavigation}>
              <IconButton icon={isRTL ? "chevron-forward" : "chevron-back"} label="Previous day" variant="plain" onPress={() => select(addDaysToDateKey(selectedKey, -1))} />
              <View style={styles.dayCopy}>
                <Text style={styles.dayTitle}>{selectedKey === civilDateKey ? "Today" : dateLabel(selectedKey)}</Text>
                <Text localize={false} style={styles.date}>{dateLabel(selectedKey, true)}</Text>
              </View>
              <IconButton icon={isRTL ? "chevron-back" : "chevron-forward"} label="Next day" variant="plain" disabled={selectedKey >= activeKey} onPress={() => select(addDaysToDateKey(selectedKey, 1))} />
            </View>
            <JournalSummary journal={journal} dateKey={selectedKey} showCount={false} />
            {PRAYER_NAMES.map(prayer => {
              const start = selectedDay?.instants[prayer];
              const status = getJournalDayStatus(journal.days, selectedKey, prayer, start, now, activeKey, trackingStart);
              return <View key={prayer} style={styles.prayerRow} testID={`journal-row-${prayer.toLowerCase()}`}>
                <View style={styles.prayerCopy}>
                  <Text style={styles.prayerName}>{prayer}</Text>
                  <Text style={[styles.status, status === "recorded" && {color: colors.accent}]}>{journal.ready ? STATUS_LABELS[status] : "—"}</Text>
                </View>
                <Text style={styles.time}>{formatPrayerTime(start, settings.timeFormat, location.timeZone, language)}</Text>
                <PrayerCheck journal={journal} dateKey={selectedKey} prayer={prayer} start={start} now={now} timeZone={location.timeZone} />
              </View>;
            })}
            <Pressable accessibilityRole="button"
              accessibilityHint={journal.days[selectedKey]?.exempt
                ? "This day is excluded from totals. Existing entries are kept."
                : "For days when prayer is not obligatory, such as during menstruation."}
              accessibilityState={{disabled: !journal.ready || journal.busyKey !== null || journal.days[selectedKey]?.unreadable}}
              disabled={!journal.ready || journal.busyKey !== null || journal.days[selectedKey]?.unreadable} onPress={() => journal.toggleExempt(selectedKey)}
              style={({pressed}) => [styles.exemption, (pressed || !journal.ready || journal.busyKey !== null) && {opacity: .5}]}>
              <Text style={styles.exemptionText}>{journal.days[selectedKey]?.exempt ? "Remove exemption" : "Mark day exempt"}</Text>
            </Pressable>
          </SurfaceCard>

          {journal.ready ? <>
            <JournalHistory journal={journal} location={location} settings={settings} now={now} activeKey={activeKey}
              selectedKey={selectedKey} onSelect={select} onReturnToday={() => {select(activeKey);scroll.current?.scrollTo({y: 0, animated: false});}} />

          </> : null}
        </>}
      </View>
    </ScrollView>
  </View>;
}

const useStyles = createThemedStyles(colors => StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  content: {paddingHorizontal: 20, flexGrow: 1},
  page: {width: "100%", maxWidth: 620, alignSelf: "center", gap: 16},
  empty: {padding: 24, gap: 16, marginTop: 16},
  emptyIcon: {alignSelf: "flex-start", backgroundColor: colors.accentSurface, padding: 14, borderRadius: 18},
  emptyTitle: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 23, color: colors.ink},
  body: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 15, color: colors.inkSoft, lineHeight: 23},
  caption: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft},
  dayCard: {overflow: "hidden"},
  dayNavigation: {flexDirection: "row", alignItems: "center", gap: 4, padding: 8},
  dayCopy: {flex: 1, minWidth: 0, alignItems: "center", gap: 4, paddingVertical: 8},
  dayTitle: {fontFamily: "BricolageGrotesque_700Bold", fontSize: 18, color: colors.ink, textAlign: "center"},
  date: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft, textAlign: "center"},
  prayerRow: {flexDirection: "row", alignItems: "center", paddingStart: 18, paddingEnd: 8, paddingVertical: 10, minHeight: 68, gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border},
  prayerCopy: {flex: 1, minWidth: 0, gap: 4},
  prayerName: {fontFamily: "BricolageGrotesque_600SemiBold", fontSize: 15, color: colors.ink},
  status: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft},
  time: {fontFamily: "BricolageGrotesque_500Medium", fontSize: 12, color: colors.inkSoft, maxWidth: "37%", flexShrink: 1},
  exemption: {paddingHorizontal: 18, minHeight: 44, alignSelf: "flex-start", justifyContent: "center"},
  exemptionText: {fontFamily: "BricolageGrotesque_400Regular", fontSize: 11, color: colors.inkSoft, textDecorationLine: "underline"},
}));
