import { Platform } from "react-native";
import * as Notifications from "./localNotifications";

import type { NotificationAccess, PrayerAlarmSettings, PrayerDay } from "../types";
import { resolveNotificationAccess } from "./notificationAccess";
import { getPrayerAlarmOccurrences } from "./prayerPeriods";
import { getPrayerNotificationIds, savePrayerNotificationIds } from "./storage";
import { syncPrayerReminders } from "./reminderSync";

const CHANNEL_ID = "prayer-times";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function preparePrayerNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Prayer times",
    description: "Custom alarms before each prayer period ends.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 200, 160, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

export function getNotificationAccess(request = false): Promise<NotificationAccess> {
  return resolveNotificationAccess({
    platform: Platform.OS,
    prepareChannel: preparePrayerNotificationChannel,
    getPermission: Notifications.getPermissionsAsync,
    requestPermission: () => Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false }, android: {} }),
    getChannel: () => Notifications.getNotificationChannelAsync(CHANNEL_ID)
  }, request);
}

export async function ensureNotificationPermission(requestIfNeeded: boolean): Promise<boolean> {
  const access = await getNotificationAccess(requestIfNeeded);
  return access.status === "granted" && !access.channelBlocked;
}

export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: "prayer-reminder-test",
    content: { title: "PrayerTime test reminder", body: "Prayer notifications are working on this phone.", sound: "default", data: { kind: "prayer-test" } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, repeats: false, ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}) }
  });
}

export function listenForTestNotification(onReceived: () => void): () => void {
  if (Platform.OS === "web") return () => undefined;
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    if (notification.request.content.data?.kind === "prayer-test") onReceived();
  });
  return () => subscription.remove();
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
  requestPermission = false
): Promise<{ scheduled: boolean; count: number; reason?: "permission" }> {
  const granted = await ensureNotificationPermission(requestPermission);
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
        identifier: `prayer-end:${occurrence.prayer}:${occurrence.trigger.getTime()}:${occurrence.minutesBeforeEnd}`,
        content: {
          title: `${occurrence.prayer} time ending soon`,
          body: `${occurrence.prayer} ends in ${occurrence.minutesBeforeEnd} minutes.`,
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
