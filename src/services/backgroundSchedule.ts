import type {AppLocation, AppSettings, PrayerDay} from "../types";

interface BackgroundSchedulePorts {
  load(): Promise<{settings: AppSettings; location: AppLocation | null}>;
  cancel(): Promise<unknown>;
  calendar(location: AppLocation, settings: AppSettings, now: Date): PrayerDay[];
  schedule(calendar: PrayerDay[], settings: AppSettings, requestPermission: false): Promise<{scheduled: boolean}>;
  widgets(calendar: PrayerDay[], location: AppLocation, settings: AppSettings, now: Date): Promise<unknown>;
}

// Read the persisted opt-in every time. Background work never prompts or asks
// for a fresh GPS position; it uses the user's confirmed saved location.
export async function refreshSavedSchedule(ports: BackgroundSchedulePorts, now = new Date()): Promise<"success" | "unavailable" | "failed"> {
  try {
    const {settings, location} = await ports.load();
    if (!settings.notificationsEnabled && !settings.prayerStartNotificationsEnabled) {
      await ports.cancel();
      return "success";
    }
    if (!location) return "unavailable";
    const calendar = ports.calendar(location, settings, now);
    const result = await ports.schedule(calendar, settings, false);
    await ports.widgets(calendar, location, settings, now);
    return result.scheduled ? "success" : "unavailable";
  } catch {return "failed";}
}
