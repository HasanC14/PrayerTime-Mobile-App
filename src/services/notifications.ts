import { Platform } from "react-native";
import * as Notifications from "./localNotifications";

import type { AppLanguage, NotificationAccess, PrayerAlarmSettings, PrayerDay } from "../types";
import { translateMessage } from "../i18n/translate";
import { resolveNotificationAccess } from "./notificationAccess";
import { getPrayerAlarmOccurrences } from "./prayerPeriods";
import { getPrayerNotificationIds, savePrayerNotificationIds } from "./storage";
import { syncPrayerReminders } from "./reminderSync";
import { reminderTimingKey } from "./reminderSetup";

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
    description: translateMessage("Custom alarms before each prayer period ends.", language),
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
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
  await syncPrayerReminders([], notificationAdapter);
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
  alarms: PrayerAlarmSettings,
  requestPermission = false,
  exactAlarmAllowed: boolean | null = null,
  language: AppLanguage = "en"
): Promise<{ scheduled: boolean; count: number; reason?: "permission" }> {
  const granted = await ensureNotificationPermission(requestPermission, language);
  if (!granted) return { scheduled: false, count: 0, reason: "permission" };

  const now = new Date();
  const futureOccurrences = getPrayerAlarmOccurrences(calendar, alarms, now)
    .slice(0, 35);

  const reminders = futureOccurrences.map((occurrence) => {
      const trigger = {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: occurrence.trigger,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {})
      } as Notifications.DateTriggerInput;

      return {
        identifier: `prayer-end:${occurrence.prayer}:${occurrence.trigger.getTime()}:${occurrence.minutesBeforeEnd}:${reminderTimingKey(exactAlarmAllowed)}:${language}`,
        content: {
          title: translateMessage("{prayer} time ending soon", language, { prayer: occurrence.prayer }),
          body: translateMessage("{prayer} ends in {minutes} minutes.", language, { prayer: occurrence.prayer, minutes: occurrence.minutesBeforeEnd }),
          sound: "default",
          data: {
            kind: "prayer-end-alarm",
            prayer: occurrence.prayer,
            dateKey: occurrence.dateKey,
            minutesBeforeEnd: occurrence.minutesBeforeEnd,
            periodEnd: occurrence.periodEnd.toISOString()
          }
        },
        trigger
      };
  });
  const count = await syncPrayerReminders(reminders, notificationAdapter);
  return { scheduled: true, count };
}
