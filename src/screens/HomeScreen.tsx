import { useTextScale } from "../typography";
import { useI18n } from "../i18n/context";
import { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Pressable, Text } from "../i18n/native";
import { PrayerHeroCard } from "../components/PrayerHeroCard";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SurfaceCard } from "../components/ui";
import { CoffeeSupportIcon } from "../components/CoffeeSupportIcon";
import {
  DEFAULT_PRAYER_ALARMS,
  PRAYER_EVENT_META,
} from "../constants/settings";
import { getDateKeyInTimeZone } from "../services/prayerTimes";
import { getPrayerFocus, getPrayerPeriods } from "../services/prayerPeriods";
import { createThemedStyles, radii, spacing } from "../theme";
import { PRAYER_NAMES } from "../types";
import type {
  AppLocation,
  AppSettings,
  LocationIssue,
  PrayerDay,
  PrayerName,
  PrayerState,
} from "../types";
import {
  formatLongDate,
  formatPrayerTime,
  formatPrayerTimeRange,
  getProgressBetween,
} from "../utils/time";
import type { PrayerGuidanceWindow } from "../utils/time";

export function HomeScreen({
  location,
  settings,
  now,
  today,
  calendar,
  prayerState,
  guidance,
  calculationError,
  locating,
  locationIssue,
  notificationIssue,
  locationProgress,
  onOpenLocation,
  onDonate,
  onTogglePrayerAlarm,
  onRefresh,
  onOpenGuidance,
  onRetry,
}: {
  location: AppLocation;
  settings: AppSettings;
  now: Date;
  today?: PrayerDay;
  calendar: PrayerDay[];
  prayerState: PrayerState;
  guidance: PrayerGuidanceWindow | null;
  calculationError: string | null;
  locating: boolean;
  locationIssue: LocationIssue | null;
  notificationIssue: string | null;
  locationProgress: string | null;
  onOpenLocation: () => void;
  onDonate: () => void;
  onTogglePrayerAlarm: (prayer: PrayerName) => Promise<boolean>;
  onRefresh: () => void;
  onOpenGuidance: () => void;
  onRetry: () => void;
}) {
  const { colors, styles } = useStyles();
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const textScale = useTextScale();
  const compact = width < 360 || fontScale * textScale > 1.2 || language === "bn";
  const timeZone = location.timeZone;
  const todayKey = getDateKeyInTimeZone(now, timeZone);
  const nextKey = prayerState.next
    ? getDateKeyInTimeZone(prayerState.next.date, timeZone)
    : null;
  const prayerFocus = useMemo(
    () => getPrayerFocus(now, calendar),
    [calendar, now],
  );
  const remaining = prayerFocus
    ? prayerFocus.target.getTime() - now.getTime()
    : 0;
  const heroRemaining = guidance
    ? guidance.end.getTime() - now.getTime()
    : remaining;
  const heroProgress = guidance
    ? getProgressBetween(guidance.start, guidance.end, now)
    : prayerFocus?.progress ?? 0;
  const prayerAlarmMinutes =
    settings.prayerAlarmMinutes ?? DEFAULT_PRAYER_ALARMS;
  const notificationsOperational =
    settings.notificationsEnabled &&
    !notificationIssue &&
    PRAYER_NAMES.some((prayer) => prayerAlarmMinutes[prayer] !== null);
  const showRamadan =
    Boolean(today) &&
    (settings.ramadanMode === "always" ||
      (settings.ramadanMode === "auto" && today?.hijriDate.isRamadan));

  const hijriLabel = useMemo(() => {
    if (!today?.hijriDate.day) return "";
    return `${today.hijriDate.day} ${today.hijriDate.month} ${today.hijriDate.year} AH`;
  }, [today]);
  const todayPrayerPeriods = useMemo(
    () =>
      new Map(
        getPrayerPeriods(calendar)
          .filter((period) => period.dateKey === today?.dateKey)
          .map((period) => [period.prayer, period]),
      ),
    [calendar, today?.dateKey],
  );

  return (
    <View style={styles.screen}>
        <View style={[styles.appBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Current location, ${location.name}`}
            accessibilityHint="Opens location settings"
            onPress={onOpenLocation}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="location" size={18} color={colors.accent} />
            <View style={styles.locationCopy}>
              <Text numberOfLines={1} style={styles.locationName}>
                {location.name}
              </Text>

            </View>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Buy me a coffee"
            onPress={onDonate}
            style={({ pressed }) => [
              styles.coffeeButton,
              pressed && styles.pressed,
            ]}
          >
            <CoffeeSupportIcon
              size={34}
              primaryColor={colors.ink}
              accentColor={colors.accent}
            />
          </Pressable>
        </View>

    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={locating}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: spacing.sm,
          paddingBottom: spacing.xxl,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        {locationIssue || notificationIssue || locating ? (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={colors.warningText}
            />
            <Text style={styles.noticeText}>
              {locating ? locationProgress || "Finding your location…" : locationIssue?.message || notificationIssue}
            </Text>
          </View>
        ) : null}

        {calculationError || !today || !prayerState.next || !prayerFocus ? (
          <SurfaceCard style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={25}
              color={colors.danger}
            />
            <Text style={styles.errorTitle}>Prayer times are unavailable</Text>
            <Text style={styles.errorText}>
              {calculationError || "Refresh or choose another location."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </SurfaceCard>
        ) : (
          <>
            <PrayerHeroCard focus={prayerFocus} remaining={heroRemaining} progress={heroProgress} guidance={guidance}
              next={prayerState.next} timeFormat={settings.timeFormat} timeZone={timeZone} />

            <View style={styles.dateStrip}>
              <View>
                <Text style={styles.dateLabel}>Date</Text>
                {hijriLabel ? (
                  <Text style={styles.hijriDate}>{hijriLabel}</Text>
                ) : null}
                <Text style={styles.gregorianDate}>
                  {formatLongDate(now, timeZone, language)}
                </Text>
              </View>
            </View>

            {guidance ? (
              <Pressable
                accessibilityRole="button"
                onPress={onOpenGuidance}
                style={({ pressed }) => [
                  styles.guidance,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="warning-outline"
                  size={19}
                  color={colors.danger}
                />
                <View style={styles.guidanceCopy}>
                  <Text style={styles.guidanceTitle}>
                    Prohibited time · {formatPrayerTimeRange(
                      guidance.start,
                      guidance.end,
                      settings.timeFormat,
                      timeZone, language,
                    )}
                  </Text>
                  <Text numberOfLines={1} style={styles.guidanceText}>
                    {guidance.message}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={colors.danger}
                />
              </Pressable>
            ) : null}

            <SurfaceCard style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="sunny-outline"
                  size={19}
                  color={colors.accent}
                />
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Sunrise</Text>
                <Text style={styles.summaryValue}>
                  {formatPrayerTime(
                    today.instants.Sunrise,
                    settings.timeFormat,
                    timeZone, language,
                  )}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Sunset</Text>
                <Text style={styles.summaryValue}>
                  {formatPrayerTime(
                    today.instants.Maghrib,
                    settings.timeFormat,
                    timeZone, language,
                  )}
                </Text>
              </View>
            </SurfaceCard>

            {showRamadan ? (
              <SurfaceCard style={styles.summaryCard}>
                <View style={styles.summaryIcon}>
                  <Ionicons name="moon" size={18} color={colors.accent} />
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Sehri ends</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrayerTime(
                      today.instants.Fajr,
                      settings.timeFormat,
                      timeZone, language,
                    )}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Iftar</Text>
                  <Text style={styles.summaryValue}>
                    {formatPrayerTime(
                      today.instants.Maghrib,
                      settings.timeFormat,
                      timeZone, language,
                    )}
                  </Text>
                </View>
              </SurfaceCard>
            ) : null}

            <SurfaceCard style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <View>
                  <Text accessibilityRole="header" style={styles.scheduleTitle}>
                    Prayer times
                  </Text>
                  <Text style={styles.scheduleMethod}>
                    {settings.method === "auto"
                      ? `Automatic · ${today.methodName}`
                      : today.methodName}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Prayer-time guidance"
                  onPress={onOpenGuidance}
                  style={styles.infoButton}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={colors.inkSoft}
                  />
                </Pressable>
              </View>
              {PRAYER_NAMES.map((name, index) => {
                const period = todayPrayerPeriods.get(name);
                const isNext =
                  prayerState.next?.name === name && nextKey === todayKey;
                const alarmMinutes = prayerAlarmMinutes[name];
                const alarmActive =
                  notificationsOperational && alarmMinutes !== null;
                const meta = PRAYER_EVENT_META[name];
                return (
                  <View
                    key={name}
                    style={[
                      styles.prayerRow,
                      index < PRAYER_NAMES.length - 1 && styles.prayerBorder,
                      isNext && styles.prayerRowNext,
                    ]}
                  >
                    {isNext ? <View style={styles.nextMarker} /> : null}
                    <View style={styles.prayerIcon}>
                      <Ionicons
                        name={meta.icon}
                        size={20}
                        color={isNext ? colors.accent : colors.inkSoft}
                      />
                    </View>
                    <View style={styles.prayerCopy}>
                      <View style={styles.prayerNameRow}>
                        <Text
                          style={[
                            styles.prayerName,
                            isNext && styles.prayerNameNext,
                          ]}
                        >
                          {name}
                        </Text>
                        {isNext ? (
                          <Text numberOfLines={1} style={styles.nextTag}>NEXT</Text>
                        ) : null}
                      </View>
                      {compact ? <Text style={[styles.prayerTime, styles.compactTime, isNext && styles.prayerTimeNext]}>
                        {formatPrayerTimeRange(period?.start, period?.end, settings.timeFormat, timeZone, language)}
                      </Text> : null}
                    </View>
                    {!compact ? <View
                      accessibilityLabel={t("{prayer} starts {start} and ends {end}", { prayer: name, start: formatPrayerTime(period?.start, settings.timeFormat, timeZone, language), end: formatPrayerTime(period?.end, settings.timeFormat, timeZone, language) })}
                      style={styles.prayerTimeRange}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.prayerTime,
                          isNext && styles.prayerTimeNext,
                        ]}
                      >
                        {formatPrayerTimeRange(
                          period?.start,
                          period?.end,
                          settings.timeFormat,
                          timeZone, language,
                        )}
                      </Text>
                    </View> : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${alarmMinutes === null ? t("{prayer} reminder, off", { prayer: name }) : t("{prayer} reminder, {minutes} minutes before end", { prayer: name, minutes: alarmMinutes })}${settings.notificationsEnabled ? "" : t(", notifications disabled")}`}
                      hitSlop={4}
                      onPress={() => void onTogglePrayerAlarm(name)}
                      style={({ pressed }) => [
                        styles.alarmButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={
                          alarmActive ? "notifications" : "notifications-off-outline"
                        }
                        size={19}
                        color={alarmActive ? colors.accent : colors.inkSoft}
                      />
                    </Pressable>
                  </View>
                );
              })}
            </SurfaceCard>
          </>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl },
  page: { alignSelf: "center", maxWidth: 620, width: "100%" },
  appBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    alignSelf: "center",
    width: "100%",
    maxWidth: 660,
  },
  locationButton: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
  },
  locationCopy: { flex: 1 },
  locationName: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 15,
    fontWeight: "700",
  },
  locationStatus: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 12,
    marginTop: 3,
  },
  coffeeButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  pressed: { opacity: 0.65 },
  notice: {
    alignItems: "center",
    backgroundColor: colors.warningSurface,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.warningText,
    flex: 1,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 12,
  },
  dateStrip: { marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  dateLabel: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 10,
    marginBottom: 3,
  },
  hijriDate: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_800ExtraBold",
    fontSize: 17,
    fontWeight: "800",
  },
  gregorianDate: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  guidance: {
    alignItems: "center",
    backgroundColor: colors.dangerSurface,
    borderRadius: radii.md,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  guidanceCopy: { flex: 1 },
  guidanceTitle: {
    color: colors.danger,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 12,
    fontWeight: "700",
  },
  guidanceText: {
    color: colors.danger,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 10,
    marginTop: 1,
  },
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.md,
    minHeight: 68,
    paddingHorizontal: spacing.lg,
  },
  summaryIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    height: 34,
    justifyContent: "center",
    marginEnd: spacing.md,
    width: 34,
  },
  summaryItem: { flex: 1 },
  summaryLabel: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 10,
  },
  summaryValue: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
    marginTop: 2,
  },
  summaryDivider: {
    backgroundColor: colors.border,
    height: 34,
    marginHorizontal: spacing.md,
    width: 1,
  },
  scheduleCard: { overflow: "hidden" },
  scheduleHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  scheduleTitle: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 16,
    fontWeight: "700",
  },
  scheduleMethod: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 11,
    marginTop: 3,
  },
  infoButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  prayerRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 64,
    paddingHorizontal: spacing.md,
    position: "relative",
  },
  prayerBorder: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  prayerRowNext: { backgroundColor: colors.selectedSurface },
  nextMarker: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 2,
    borderTopRightRadius: 2,
    bottom: 5,
    start: 0,
    position: "absolute",
    top: 5,
    width: 3,
  },
  prayerIcon: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginEnd: spacing.sm,
    width: 32,
  },
  prayerCopy: { flex: 1 },
  prayerNameRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  prayerName: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_600SemiBold",
    fontSize: 14,
    fontWeight: "600",
  },
  prayerNameNext: {
    fontFamily: "BricolageGrotesque_700Bold",
    fontWeight: "700",
  },
  nextTag: {
    flexShrink: 0,
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    color: colors.onAccent,
    fontFamily: "BricolageGrotesque_800ExtraBold",
    fontSize: 9,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  prayerTimeRange: { alignItems: "flex-end", minWidth: 112 },
  compactTime: { marginTop: 4 },
  prayerTime: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  prayerTimeNext: { color: colors.accent },
  alarmButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    marginStart: spacing.xs,
    width: 44,
  },
  errorCard: { alignItems: "center", gap: spacing.sm, padding: spacing.xxl },
  errorTitle: {
    color: colors.ink,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    color: colors.inkSoft,
    fontFamily: "BricolageGrotesque_400Regular",
    fontSize: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.accent,
    fontFamily: "BricolageGrotesque_700Bold",
    fontSize: 13,
    fontWeight: "700",
  },
}));
