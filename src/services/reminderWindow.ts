// Include the following day so the last Isha period has its actual Fajr end.
export const REMINDER_CALENDAR_DAYS = 15;

export function getReminderWindow(platform: string): { days: number; maxNotifications: number } {
  return platform === "ios"
    ? { days: 12, maxNotifications: 60 }
    : { days: 14, maxNotifications: 70 };
}
