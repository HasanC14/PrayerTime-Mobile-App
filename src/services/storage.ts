import AsyncStorage from "@react-native-async-storage/async-storage";
import tzLookup from "tz-lookup";

import {
  DEFAULT_ALARM_LEAD_MINUTES,
  DEFAULT_PRAYER_ALARMS,
  DEFAULT_SETTINGS,
  FALLBACK_LOCATION
} from "../constants/settings";
import type { AppLocation, AppSettings } from "../types";

const V2_PREFIX = "@PrayerTime:v2:";
const LEGACY_PREFIX = "@PrayerTime:";

const KEYS = {
  settings: `${V2_PREFIX}settings`,
  location: `${V2_PREFIX}location`,
  recentLocations: `${V2_PREFIX}recentLocations`,
  notificationIds: `${V2_PREFIX}notificationIds`,
  notificationSetupSeen: `${V2_PREFIX}notificationSetupSeen`
} as const;

let writeQueue: Promise<void> = Promise.resolve();

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isFiniteCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(lat: number, lng: number, savedValue: unknown): string {
  if (isValidTimeZone(savedValue)) return savedValue;

  try {
    const resolved = tzLookup(lat, lng);
    if (isValidTimeZone(resolved)) return resolved;
  } catch {
    // Fall through to the device timezone for unusual coordinates.
  }

  const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(deviceTimeZone) ? deviceTimeZone : "UTC";
}

function validatePrayerAlarmMinutes(value: unknown): AppSettings["prayerAlarmMinutes"] {
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const resolve = (name: keyof AppSettings["prayerAlarmMinutes"]): number | null => {
    const minutes = candidate[name];
    if (minutes === null) return null;
    if (typeof minutes === "number" && Number.isInteger(minutes) && minutes >= 1 && minutes <= 60) {
      return minutes;
    }
    return DEFAULT_PRAYER_ALARMS[name];
  };

  return {
    Fajr: resolve("Fajr"),
    Dhuhr: resolve("Dhuhr"),
    Asr: resolve("Asr"),
    Maghrib: resolve("Maghrib"),
    Isha: resolve("Isha")
  };
}

export function validateSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
  const candidate = value as Record<string, unknown>;
  const validMethodIds = new Set(["auto", 1, 2, 3, 4, 5, 8, 9, 10, 11, 13, 15, 16]);
  const legacyRamadan = candidate.ramadanMode;
  const alarmLeadMinutes =
    typeof candidate.alarmLeadMinutes === "number" &&
    Number.isInteger(candidate.alarmLeadMinutes) &&
    candidate.alarmLeadMinutes >= 1 &&
    candidate.alarmLeadMinutes <= 60
      ? candidate.alarmLeadMinutes
      : DEFAULT_ALARM_LEAD_MINUTES;
  const savedPrayerAlarms = validatePrayerAlarmMinutes(candidate.prayerAlarmMinutes);
  const prayerAlarmMinutes = Object.fromEntries(
    Object.entries(savedPrayerAlarms).map(([prayer, minutes]) => [
      prayer,
      minutes === null ? null : alarmLeadMinutes
    ])
  ) as AppSettings["prayerAlarmMinutes"];

  return {
    method: validMethodIds.has(candidate.method as string | number)
      ? (candidate.method as AppSettings["method"])
      : DEFAULT_SETTINGS.method,
    school: candidate.school === 0 || candidate.school === 1 ? candidate.school : DEFAULT_SETTINGS.school,
    midnightMode:
      candidate.midnightMode === 0 || candidate.midnightMode === 1
        ? candidate.midnightMode
        : DEFAULT_SETTINGS.midnightMode,
    latitudeAdjustmentMethod:
      candidate.latitudeAdjustmentMethod === 1 ||
      candidate.latitudeAdjustmentMethod === 2 ||
      candidate.latitudeAdjustmentMethod === 3
        ? candidate.latitudeAdjustmentMethod
        : DEFAULT_SETTINGS.latitudeAdjustmentMethod,
    timeFormat: candidate.timeFormat === "24h" ? "24h" : "12h",
    ramadanMode:
      legacyRamadan === "auto" || legacyRamadan === "always" || legacyRamadan === "off"
        ? legacyRamadan
        : legacyRamadan === true
          ? "always"
          : "auto",
    themeMode:
      candidate.themeMode === "light" || candidate.themeMode === "dark" || candidate.themeMode === "system"
        ? candidate.themeMode
        : "system",
    notificationsEnabled: candidate.notificationsEnabled === true,
    alarmLeadMinutes,
    prayerAlarmMinutes
  };
}

export function validateLocation(value: unknown): AppLocation | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (!isFiniteCoordinate(candidate.lat, -90, 90) || !isFiniteCoordinate(candidate.lng, -180, 180)) {
    return null;
  }

  const isLegacySilentFallback =
    !candidate.source &&
    Math.abs(candidate.lat - FALLBACK_LOCATION.lat) < 0.000001 &&
    Math.abs(candidate.lng - FALLBACK_LOCATION.lng) < 0.000001;
  if (isLegacySilentFallback) return null;

  const timeZone = resolveTimeZone(candidate.lat, candidate.lng, candidate.timeZone);

  return {
    name:
      typeof candidate.name === "string" && candidate.name.trim()
        ? candidate.name.trim().slice(0, 80)
        : "Saved location",
    lat: candidate.lat,
    lng: candidate.lng,
    source: candidate.source === "device" ? "device" : "manual",
    // A restored snapshot is cached until the phone supplies a new reading.
    fixKind: candidate.source === "device" ? "cached" : undefined,
    countryCode:
      typeof candidate.countryCode === "string" ? candidate.countryCode.toUpperCase().slice(0, 2) : undefined,
    timeZone,
    accuracy:
      typeof candidate.accuracy === "number" && Number.isFinite(candidate.accuracy)
        ? Math.max(0, candidate.accuracy)
        : undefined,
    capturedAt:
      typeof candidate.capturedAt === "number" && Number.isFinite(candidate.capturedAt)
        ? candidate.capturedAt
        : Date.now()
  };
}

function distanceInKm(a: AppLocation, b: AppLocation): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(b.lat - a.lat);
  const longitudeDelta = toRadians(b.lng - a.lng);
  const latitudeA = toRadians(a.lat);
  const latitudeB = toRadians(b.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function mergeRecentLocations(location: AppLocation, recent: AppLocation[]): AppLocation[] {
  const filtered = recent.filter((item) => distanceInKm(item, location) > 1);
  return [location, ...filtered].slice(0, 5);
}

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.catch(() => undefined);
  return next;
}

export async function loadPersistedState(): Promise<{
  settings: AppSettings;
  location: AppLocation | null;
  recentLocations: AppLocation[];
  notificationSetupSeen: boolean;
}> {
  const entries = await AsyncStorage.multiGet([
    KEYS.settings,
    KEYS.location,
    KEYS.recentLocations,
    KEYS.notificationSetupSeen,
    `${LEGACY_PREFIX}settings`,
    `${LEGACY_PREFIX}location`,
    `${LEGACY_PREFIX}recentLocations`
  ]);
  const values = new Map(entries);

  const settingsValue = parseJson(values.get(KEYS.settings) ?? values.get(`${LEGACY_PREFIX}settings`) ?? null);
  const locationValue = parseJson(values.get(KEYS.location) ?? values.get(`${LEGACY_PREFIX}location`) ?? null);
  const recentValue = parseJson(
    values.get(KEYS.recentLocations) ?? values.get(`${LEGACY_PREFIX}recentLocations`) ?? null
  );

  const recentLocations = Array.isArray(recentValue)
    ? recentValue.map(validateLocation).filter((item): item is AppLocation => Boolean(item)).slice(0, 5)
    : [];

  return {
    settings: validateSettings(settingsValue),
    location: validateLocation(locationValue),
    recentLocations,
    notificationSetupSeen: values.get(KEYS.notificationSetupSeen) === "true" || validateSettings(settingsValue).notificationsEnabled
  };
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return enqueueWrite(() => AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings)));
}

export function saveLocation(location: AppLocation | null): Promise<void> {
  return enqueueWrite(() =>
    location ? AsyncStorage.setItem(KEYS.location, JSON.stringify(location)) : AsyncStorage.removeItem(KEYS.location)
  );
}

export function saveRecentLocations(locations: AppLocation[]): Promise<void> {
  return enqueueWrite(() => AsyncStorage.setItem(KEYS.recentLocations, JSON.stringify(locations.slice(0, 5))));
}

export async function getPrayerNotificationIds(): Promise<string[]> {
  const value = parseJson(await AsyncStorage.getItem(KEYS.notificationIds));
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function savePrayerNotificationIds(ids: string[]): Promise<void> {
  return enqueueWrite(() => AsyncStorage.setItem(KEYS.notificationIds, JSON.stringify(ids)));
}

export function saveNotificationSetupSeen(): Promise<void> {
  return enqueueWrite(() => AsyncStorage.setItem(KEYS.notificationSetupSeen, "true"));
}
