import { Linking, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo";

interface ReminderAccessModule {
  canScheduleExactAlarmsAsync: () => Promise<boolean>;
  openExactAlarmSettingsAsync: () => Promise<void>;
  openNotificationSettingsAsync: (channelId: string | null) => Promise<void>;
}

const nativeAccess = Platform.OS === "android"
  ? requireOptionalNativeModule<ReminderAccessModule>("PrayerReminderAccess")
  : null;

// null means not applicable, or unavailable in Expo Go/older native builds.
export async function getExactAlarmAccess(): Promise<boolean | null> {
  if (!nativeAccess) return null;
  return nativeAccess.canScheduleExactAlarmsAsync();
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!nativeAccess) throw new Error("On-time reminder setup needs the latest Android app build.");
  await nativeAccess.openExactAlarmSettingsAsync();
}

export async function openNotificationSettings(channelBlocked: boolean): Promise<void> {
  if (nativeAccess) await nativeAccess.openNotificationSettingsAsync(channelBlocked ? "prayer-times" : null);
  else if (Platform.OS !== "web") await Linking.openSettings();
}
