import { PRAYER_NAMES, type AppLanguage, type AppSettings, type PrayerDay } from "../types";
import { translateMessage } from "../i18n/translate";
import { getPrayerAlarmOccurrences } from "./prayerPeriods";
import { reminderTimingKey } from "./reminderSetup";
import { getReminderWindow } from "./reminderWindow";

export type PrayerNotificationSettings = Pick<AppSettings, "notificationsEnabled" | "prayerStartNotificationsEnabled" | "prayerAlarmMinutes">;

// Merge both kinds before limiting the queue so iOS keeps the nearest reminders
// of both kinds, and never exceeds its pending-notification budget.
export function buildPrayerNotificationPlan(calendar: PrayerDay[], settings: PrayerNotificationSettings,
  platform: string, now = new Date(), exactAlarmAllowed: boolean | null = null, language: AppLanguage = "en") {
  const window = getReminderWindow(platform, settings.prayerStartNotificationsEnabled);
  const timing = reminderTimingKey(exactAlarmAllowed);
  const ending = settings.notificationsEnabled ? getPrayerAlarmOccurrences(calendar, settings.prayerAlarmMinutes, now, window.days).map(occurrence => ({
    date: occurrence.trigger,
    identifier: `prayer-end:${occurrence.prayer}:${occurrence.trigger.getTime()}:${occurrence.minutesBeforeEnd}:${timing}:${language}`,
    content: {
      title: translateMessage("{prayer} time ending soon", language, {prayer: occurrence.prayer}),
      body: translateMessage("{prayer} ends in {minutes} minutes.", language, {prayer: occurrence.prayer, minutes: occurrence.minutesBeforeEnd}),
      sound: "default",
      data: {kind: "prayer-end-alarm", prayer: occurrence.prayer, dateKey: occurrence.dateKey,
        minutesBeforeEnd: occurrence.minutesBeforeEnd, periodEnd: occurrence.periodEnd.toISOString()}
    }
  })) : [];
  const horizon = now.getTime() + window.days * 86_400_000;
  const starts = settings.prayerStartNotificationsEnabled ? calendar.flatMap(day => PRAYER_NAMES.map(prayer => ({prayer, dateKey: day.dateKey, date: day.instants[prayer]})))
    .filter(occurrence => Number.isFinite(occurrence.date.getTime()) && occurrence.date > now && occurrence.date.getTime() <= horizon)
    .map(occurrence => ({
      date: occurrence.date,
      identifier: `prayer-start:${occurrence.prayer}:${occurrence.date.getTime()}:${timing}:${language}`,
      content: {
        title: translateMessage("{prayer} time has started", language, {prayer: occurrence.prayer}),
        body: translateMessage("It’s time for {prayer}.", language, {prayer: occurrence.prayer}),
        sound: "default",
        data: {kind: "prayer-start-alarm", prayer: occurrence.prayer, dateKey: occurrence.dateKey, periodStart: occurrence.date.toISOString()}
      }
    })) : [];
  return [...ending, ...starts].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, window.maxNotifications);
}
