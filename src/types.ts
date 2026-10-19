export type LocationSource = "device" | "manual";

export interface AppLocation {
  name: string;
  lat: number;
  lng: number;
  source: LocationSource;
  fixKind?: "current" | "cached";
  countryCode?: string;
  timeZone: string;
  accuracy?: number;
  capturedAt: number;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  countryCode?: string;
}

export type AppLanguage = "en" | "bn" | "ar";

export type TimeFormat = "12h" | "24h";
export type RamadanMode = "auto" | "always" | "off";
export type ThemeMode = "system" | "light" | "dark";
export type PrayerAlarmSettings = Record<"Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha", number | null>;

export interface AppSettings {
  language: AppLanguage;
  textScale: number;
  method: "auto" | number;
  school: 0 | 1;
  midnightMode: 0 | 1;
  latitudeAdjustmentMethod: 1 | 2 | 3;
  timeFormat: TimeFormat;
  ramadanMode: RamadanMode;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  alarmLeadMinutes: number;
  prayerAlarmMinutes: PrayerAlarmSettings;
}

export const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export const PRAYER_EVENTS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

export type PrayerName = (typeof PRAYER_NAMES)[number];
export type PrayerEvent = (typeof PRAYER_EVENTS)[number];

export interface PrayerDay {
  dateKey: string;
  timeZone: string;
  methodId: number;
  methodName: string;
  instants: Record<PrayerEvent | "Midnight", Date>;
  hijriDate: {
    day: string;
    month: string;
    year: string;
    isRamadan: boolean;
  };
}

export interface PrayerState {
  previous: { name: PrayerName; date: Date } | null;
  next: { name: PrayerName; date: Date } | null;
  progress: number;
}

export type LocationErrorCode =
  | "permission-denied"
  | "permission-blocked"
  | "services-disabled"
  | "settings-unsatisfied"
  | "timeout"
  | "unavailable";

export interface LocationIssue {
  code: LocationErrorCode;
  message: string;
  canOpenSettings: boolean;
}

export interface NotificationAccess {
  status: "unknown" | "undetermined" | "granted" | "denied" | "blocked" | "unsupported";
  canAskAgain: boolean;
  channelBlocked: boolean;
  soundEnabled: boolean;
  bannersEnabled: boolean;
}
