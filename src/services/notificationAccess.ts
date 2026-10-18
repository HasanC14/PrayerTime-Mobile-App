import type { NotificationAccess } from "../types";

export interface PermissionSnapshot {
  status: string;
  granted: boolean;
  canAskAgain: boolean;
  ios?: { status: number; allowsSound?: boolean | null; allowsAlert?: boolean | null };
}
export interface NotificationAccessAdapter {
  platform: string;
  prepareChannel: () => Promise<void>;
  getPermission: () => Promise<PermissionSnapshot>;
  requestPermission: () => Promise<PermissionSnapshot>;
  getChannel: () => Promise<{ importance: number; sound?: string | null } | null>;
}

export function hasNotificationPermission(permission: PermissionSnapshot, platform: string): boolean {
  if (platform === "ios" && permission.ios && [2, 3, 4].includes(permission.ios.status)) return true;
  // Android can report granted=true with status=denied when app notifications are disabled.
  return permission.granted && permission.status === "granted";
}

export async function resolveNotificationAccess(adapter: NotificationAccessAdapter, request: boolean): Promise<NotificationAccess> {
  if (adapter.platform === "web") return { status: "unsupported", canAskAgain: false, channelBlocked: false, soundEnabled: false, bannersEnabled: false };
  await adapter.prepareChannel();
  let permission = await adapter.getPermission();
  if (!hasNotificationPermission(permission, adapter.platform) && request && permission.canAskAgain !== false && !permission.granted) {
    permission = await adapter.requestPermission();
  }
  const allowed = hasNotificationPermission(permission, adapter.platform);
  const channel = adapter.platform === "android" ? await adapter.getChannel() : null;
  return {
    status: allowed ? "granted" : permission.status === "undetermined" ? "undetermined" : permission.canAskAgain === false || permission.granted ? "blocked" : "denied",
    canAskAgain: permission.canAskAgain,
    channelBlocked: channel?.importance === 0,
    soundEnabled: adapter.platform === "ios" ? permission.ios?.allowsSound !== false : channel ? channel.sound !== null : true,
    bannersEnabled: adapter.platform === "ios" ? permission.ios?.allowsAlert !== false : !channel || channel.importance >= 4
  };
}

export function notificationAccessMessage(access: NotificationAccess): string | null {
  if (access.status === "unsupported") return "Prayer notifications are available in the Android or iOS app. This web preview cannot request phone notification permission.";
  if (access.status === "blocked") return "Notifications are blocked in phone settings. Enable them there, then return to PrayerTime.";
  if (access.status === "denied") return "Notification permission was not granted. Tap Enable reminders to try again.";
  if (access.status === "undetermined") return "Enable reminders to open your phone’s notification permission request.";
  if (access.channelBlocked) return "The Prayer times notification channel is disabled. Enable it in phone notification settings.";
  if (!access.soundEnabled && access.status === "granted") return "Sound is turned off for prayer notifications. You can change it in phone notification settings.";
  if (!access.bannersEnabled && access.status === "granted") return "Pop-up banners are turned off for prayer notifications. You can enable them in phone notification settings.";
  return null;
}
