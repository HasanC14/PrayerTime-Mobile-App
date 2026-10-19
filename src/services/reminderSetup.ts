import { PRAYER_NAMES } from "../types";
import type { AppSettings, NotificationAccess, PrayerName } from "../types";

export type ReminderSelection = "all" | PrayerName;
export type ReminderSetupStep = "notifications" | "timing" | null;

export function reminderSetupStep(access: NotificationAccess, exactAlarmAllowed: boolean | null): ReminderSetupStep {
  if (access.status !== "granted" || access.channelBlocked) return "notifications";
  return exactAlarmAllowed === false ? "timing" : null;
}

export function enableReminderSelection(settings: AppSettings, selection: ReminderSelection): AppSettings {
  if (selection === "all") {
    return {
      ...settings,
      notificationsEnabled: true,
      prayerAlarmMinutes: PRAYER_NAMES.some(name => settings.prayerAlarmMinutes[name] !== null)
        ? settings.prayerAlarmMinutes
        : Object.fromEntries(PRAYER_NAMES.map(name => [name, settings.alarmLeadMinutes])) as AppSettings["prayerAlarmMinutes"]
    };
  }
  return {
    ...settings,
    notificationsEnabled: true,
    prayerAlarmMinutes: settings.notificationsEnabled
      ? { ...settings.prayerAlarmMinutes, [selection]: settings.alarmLeadMinutes }
      : Object.fromEntries(PRAYER_NAMES.map(name => [name, name === selection ? settings.alarmLeadMinutes : null])) as AppSettings["prayerAlarmMinutes"]
  };
}

export function reminderTimingKey(exactAlarmAllowed: boolean | null): string {
  return exactAlarmAllowed === null ? "default" : exactAlarmAllowed ? "exact" : "inexact";
}
