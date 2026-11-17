import AsyncStorage from "@react-native-async-storage/async-storage";
import {getNotificationCoverage, parseNotificationCoverage, type NotificationCoverage} from "./notificationCoverage";
import { Platform } from "react-native";
import * as Notifications from "./localNotifications";

import type { AppLanguage, NotificationAccess, PrayerDay } from "../types";
import { translateMessage } from "../i18n/translate";
import { resolveNotificationAccess } from "./notificationAccess";
import { getPrayerNotificationIds, savePrayerNotificationIds } from "./storage";
import { syncPrayerReminders } from "./reminderSync";
import { buildPrayerNotificationPlan, type PrayerNotificationSettings } from "./prayerNotificationPlan";

const COVERAGE_KEY = "@PrayerTime:v2:notificationCoverage";
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(work: () => Promise<T>): Promise<T> {
  const task = queue.then(work, work); queue = task.catch(() => undefined); return task;
}
export async function readNotificationCoverage(): Promise<NotificationCoverage | null> {
  try {
    return parseNotificationCoverage(await AsyncStorage.getItem(COVERAGE_KEY));
  } catch {return null;}
}
const CHANNEL_ID = "prayer-times";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function preparePrayerNotificationChannel(language: AppLanguage = "en"): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: translateMessage("Prayer times", language),
    description: translateMessage("Notifications when prayers begin and reminders before they end.", language),
    importance: Notifications.AndroidImportance.HIGH,
    // Omit sound to use Android's default; this SDK treats strings as asset names.
    vibrationPattern: [0, 200, 160, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

export function getNotificationAccess(request = false, language: AppLanguage = "en"): Promise<NotificationAccess> {
  return resolveNotificationAccess({
    platform: Platform.OS,
    prepareChannel: () => preparePrayerNotificationChannel(language),
    getPermission: Notifications.getPermissionsAsync,
    requestPermission: () => Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false }, android: {} }),
    getChannel: () => Notifications.getNotificationChannelAsync(CHANNEL_ID)
  }, request);
}

export async function ensureNotificationPermission(requestIfNeeded: boolean, language: AppLanguage = "en"): Promise<boolean> {
  const access = await getNotificationAccess(requestIfNeeded, language);
  return access.status === "granted" && !access.channelBlocked;
}

export async function cancelPrayerNotifications(): Promise<void> {
  if (Platform.OS === "web") return;
  await serialize(async () => {await syncPrayerReminders([], notificationAdapter); await AsyncStorage.removeItem(COVERAGE_KEY);});
}

const notificationAdapter = {
  list: Notifications.getAllScheduledNotificationsAsync,
  savedIds: getPrayerNotificationIds,
  cancel: Notifications.cancelScheduledNotificationAsync,
  schedule: (request: Notifications.NotificationRequestInput & { identifier: string }) => Notifications.scheduleNotificationAsync(request),
  saveIds: savePrayerNotificationIds
};

export async function schedulePrayerNotifications(
  calendar: PrayerDay[],
  settings: PrayerNotificationSettings,
  requestPermission = false,
  exactAlarmAllowed: boolean | null = null,
  language: AppLanguage = "en"
): Promise<{ scheduled: boolean; count: number; reason?: "permission"; coverage?: NotificationCoverage }> {
  return serialize(async () => {
  const granted = await ensureNotificationPermission(requestPermission, language);
  if (!granted) return { scheduled: false, count: 0, reason: "permission" };

  const plan = buildPrayerNotificationPlan(calendar, settings, Platform.OS, new Date(), exactAlarmAllowed, language);
  const reminders = plan.map(({date, ...request}) => ({
      ...request,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(Platform.OS === "android" ? {channelId: CHANNEL_ID} : {})
      } as Notifications.DateTriggerInput
    }));
  const count = await syncPrayerReminders(reminders, notificationAdapter);
  const coverage = getNotificationCoverage(plan.map(item => item.date));
  await AsyncStorage.setItem(COVERAGE_KEY, JSON.stringify(coverage));
  return { scheduled: true, count, coverage };
  });
}
