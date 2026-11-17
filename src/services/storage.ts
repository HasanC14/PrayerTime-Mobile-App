import { validateTasbeehState, type TasbeehState } from "./tasbeeh";
import { normalizeTextScale } from "../typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import tzLookup from "tz-lookup";
import {recordRevision} from "./recordChanges";
import { archiveDamagedValues, readSavedObject } from "./recoverableStorage";

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
    hijriAdjustmentDays: typeof candidate.hijriAdjustmentDays === "number" && Number.isInteger(candidate.hijriAdjustmentDays) && Math.abs(candidate.hijriAdjustmentDays) <= 2 ? candidate.hijriAdjustmentDays : 0,
    textScale: normalizeTextScale(candidate.textScale),
    heroArtwork: candidate.heroArtwork === "skyline" || candidate.heroArtwork === "moonlit" || candidate.heroArtwork === "serenity"
      ? candidate.heroArtwork : DEFAULT_SETTINGS.heroArtwork,
    language: candidate.language === "bn" || candidate.language === "ar" ? candidate.language : "en",
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
      candidate.themeMode === "light" || candidate.themeMode === "dark" || candidate.themeMode === "classic-dark" || candidate.themeMode === "system"
      || candidate.themeMode === "sand" || candidate.themeMode === "rose" || candidate.themeMode === "midnight-blue"
        ? candidate.themeMode
        : DEFAULT_SETTINGS.themeMode,
    notificationsEnabled: candidate.notificationsEnabled === true,
    prayerStartNotificationsEnabled: candidate.prayerStartNotificationsEnabled === true,
    prayerTrackingEnabled: candidate.prayerTrackingEnabled === true,
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

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const next = writeQueue.then(operation, operation);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

export async function loadPersistedState(): Promise<{
  settings: AppSettings;
  location: AppLocation | null;
  notificationSetupSeen: boolean;
}> {
  const entries = await AsyncStorage.multiGet([
    KEYS.settings,
    KEYS.location,
    KEYS.notificationSetupSeen,
    `${LEGACY_PREFIX}settings`,
    `${LEGACY_PREFIX}location`
  ]);
  const values = new Map(entries);

  const settingsValue = readSavedObject(values.get(KEYS.settings) ?? values.get(`${LEGACY_PREFIX}settings`) ?? null, KEYS.settings);
  const locationValue = readSavedObject(values.get(KEYS.location) ?? values.get(`${LEGACY_PREFIX}location`) ?? null, KEYS.location);

  return {
    settings: validateSettings(settingsValue),
    location: validateLocation(locationValue),
    notificationSetupSeen: values.get(KEYS.notificationSetupSeen) === "true" || validateSettings(settingsValue).notificationsEnabled
  };
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return enqueueWrite(async () => {
    readSavedObject(await AsyncStorage.getItem(KEYS.settings), KEYS.settings);
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
  });
}

export function saveLocation(location: AppLocation | null): Promise<void> {
  return enqueueWrite(async () => {
    readSavedObject(await AsyncStorage.getItem(KEYS.location), KEYS.location);
    if (location) await AsyncStorage.setItem(KEYS.location, JSON.stringify(location));
    else await AsyncStorage.removeItem(KEYS.location);
  });
}

// Retired history keys are the only data removed. Cleanup is optional and
// cannot prevent the current location/settings from restoring or saving.
export async function clearRecentLocationHistory(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      `${V2_PREFIX}recentLocations`, `${LEGACY_PREFIX}recentLocations`
    ]);
  } catch (error) {
    console.warn("Unable to remove old location history", error);
  }
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

export async function loadTasbeehState() {
  return validateTasbeehState(readSavedObject(await AsyncStorage.getItem(`${V2_PREFIX}tasbeeh`), `${V2_PREFIX}tasbeeh`));
}
export function saveTasbeehState(state: TasbeehState): Promise<void> {
  const revision = recordRevision();
  return enqueueWrite(async () => {
    if (revision !== recordRevision()) return;
    readSavedObject(await AsyncStorage.getItem(`${V2_PREFIX}tasbeeh`), `${V2_PREFIX}tasbeeh`);
    await AsyncStorage.setItem(`${V2_PREFIX}tasbeeh`, JSON.stringify(state));
  });
}

export function recoverDamagedPreferences(): Promise<number> {
  return enqueueRecovery();
}
function enqueueRecovery() {
  const next = writeQueue.then(() => archiveDamagedValues(AsyncStorage, [KEYS.settings, KEYS.location, `${LEGACY_PREFIX}settings`, `${LEGACY_PREFIX}location`, `${V2_PREFIX}tasbeeh`]));
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

export function withSavedStorageLock<T>(work: () => Promise<T>): Promise<T> {
  const task = writeQueue.then(work, work);
  writeQueue = task.then(() => undefined, () => undefined);
  return task;
}
