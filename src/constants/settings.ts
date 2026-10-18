import type { AppLocation, AppSettings, PrayerAlarmSettings } from "../types";

export const DEFAULT_ALARM_LEAD_MINUTES = 30;

export const DEFAULT_PRAYER_ALARMS: PrayerAlarmSettings = {
  Fajr: DEFAULT_ALARM_LEAD_MINUTES,
  Dhuhr: DEFAULT_ALARM_LEAD_MINUTES,
  Asr: DEFAULT_ALARM_LEAD_MINUTES,
  Maghrib: DEFAULT_ALARM_LEAD_MINUTES,
  Isha: DEFAULT_ALARM_LEAD_MINUTES
};

export const FALLBACK_LOCATION: AppLocation = {
  name: "Dhaka, Bangladesh",
  lat: 23.810332,
  lng: 90.4125181,
  countryCode: "BD",
  timeZone: "Asia/Dhaka",
  source: "manual",
  capturedAt: 0
};

export const DEFAULT_SETTINGS: AppSettings = {
  school: 1,
  method: "auto",
  midnightMode: 0,
  latitudeAdjustmentMethod: 3,
  timeFormat: "12h",
  ramadanMode: "auto",
  themeMode: "system",
  notificationsEnabled: false,
  alarmLeadMinutes: DEFAULT_ALARM_LEAD_MINUTES,
  prayerAlarmMinutes: DEFAULT_PRAYER_ALARMS
};

export const CALCULATION_METHODS = [
  { id: "auto", name: "Automatic", description: "Recommended method for your country." },
  { id: 1, name: "Karachi", description: "University of Islamic Sciences, Karachi." },
  { id: 2, name: "North America", description: "Islamic Society of North America." },
  { id: 3, name: "Muslim World League", description: "Commonly used across Europe and elsewhere." },
  { id: 4, name: "Umm al-Qura", description: "Commonly used in Saudi Arabia." },
  { id: 5, name: "Egyptian Authority", description: "Egyptian General Authority of Survey." },
  { id: 8, name: "Gulf Region", description: "19.5° Fajr with Isha 90 minutes after Maghrib." },
  { id: 9, name: "Kuwait", description: "Method used in Kuwait." },
  { id: 10, name: "Qatar", description: "Method used in Qatar." },
  { id: 11, name: "Singapore", description: "Method used across parts of Southeast Asia." },
  { id: 13, name: "Turkey", description: "Method used by Diyanet in Turkey." },
  { id: 15, name: "Moonsighting Committee", description: "Season-adjusted twilight method." },
  { id: 16, name: "Dubai", description: "Method used in the United Arab Emirates." }
] as const;

export const ASR_METHODS = [
  { id: 0, name: "Standard", description: "Shafi, Maliki and Hanbali calculation." },
  { id: 1, name: "Hanafi", description: "Later Asr time used by the Hanafi school." }
] as const;

export const MIDNIGHT_MODES = [
  { id: 0, name: "Standard", description: "Midpoint between sunset and the next sunrise." },
  { id: 1, name: "Jafari", description: "Midpoint between sunset and the next Fajr." }
] as const;

export const HIGH_LATITUDE_RULES = [
  { id: 1, name: "Middle of night", description: "Uses half of the night for twilight limits." },
  { id: 2, name: "Seventh of night", description: "Uses one seventh of the night." },
  { id: 3, name: "Angle based", description: "Uses a twilight-angle proportion of the night." }
] as const;

export const RAMADAN_OPTIONS = [
  { id: "auto", name: "Automatic", description: "Show fasting times during Ramadan." },
  { id: "always", name: "Always show", description: "Keep Sehri and Iftar visible year-round." },
  { id: "off", name: "Off", description: "Hide the fasting card." }
] as const;

export const THEME_OPTIONS = [
  { id: "system", name: "System", description: "Follow your phone’s appearance setting." },
  { id: "light", name: "Light", description: "Always use the light appearance." },
  { id: "dark", name: "Dark", description: "Always use the dark appearance." }
] as const;

export const PRAYER_EVENT_META = {
  Fajr: { icon: "moon-outline", subtitle: "Dawn prayer" },
  Sunrise: { icon: "sunny-outline", subtitle: "Solar event" },
  Dhuhr: { icon: "sunny", subtitle: "Midday prayer" },
  Asr: { icon: "partly-sunny-outline", subtitle: "Afternoon prayer" },
  Maghrib: { icon: "cloudy-night-outline", subtitle: "Sunset prayer" },
  Isha: { icon: "moon", subtitle: "Night prayer" }
} as const;
