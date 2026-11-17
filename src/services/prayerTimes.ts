import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PolarCircleResolution,
  PrayerTimes
} from "adhan";

import { CALCULATION_METHODS } from "../constants/settings";
import type { AppLocation, AppSettings, PrayerDay, PrayerEvent } from "../types";

const COUNTRY_METHODS: Record<string, number> = {
  AF: 1,
  BD: 1,
  IN: 1,
  PK: 1,
  US: 2,
  CA: 2,
  MX: 2,
  SA: 4,
  EG: 5,
  KW: 9,
  QA: 10,
  BN: 11,
  ID: 11,
  MY: 11,
  SG: 11,
  TR: 13,
  AE: 16
};

const TIME_ZONE_METHODS: Record<string, number> = {
  "Asia/Kabul": 1,
  "Asia/Dhaka": 1,
  "Asia/Calcutta": 1,
  "Asia/Kolkata": 1,
  "Asia/Karachi": 1,
  "America/New_York": 2,
  "America/Chicago": 2,
  "America/Denver": 2,
  "America/Los_Angeles": 2,
  "America/Toronto": 2,
  "America/Vancouver": 2,
  "America/Mexico_City": 2,
  "Asia/Riyadh": 4,
  "Africa/Cairo": 5,
  "Asia/Kuwait": 9,
  "Asia/Qatar": 10,
  "Asia/Brunei": 11,
  "Asia/Jakarta": 11,
  "Asia/Makassar": 11,
  "Asia/Jayapura": 11,
  "Asia/Kuala_Lumpur": 11,
  "Asia/Kuching": 11,
  "Asia/Singapore": 11,
  "Europe/Istanbul": 13,
  "Asia/Dubai": 16
};

function getAutomaticMethodId(countryCode?: string, timeZone?: string): number {
  if (countryCode) return COUNTRY_METHODS[countryCode.toUpperCase()] ?? 3;
  return timeZone ? TIME_ZONE_METHODS[timeZone] ?? 3 : 3;
}

export function getResolvedMethodId(
  method: AppSettings["method"],
  countryCode?: string,
  timeZone?: string
): number {
  return method === "auto" ? getAutomaticMethodId(countryCode, timeZone) : method;
}

function getCalculationParameters(methodId: number) {
  switch (methodId) {
    case 1:
      return CalculationMethod.Karachi();
    case 2:
      return CalculationMethod.NorthAmerica();
    case 3:
      return CalculationMethod.MuslimWorldLeague();
    case 4:
      return CalculationMethod.UmmAlQura();
    case 5:
      return CalculationMethod.Egyptian();
    case 8: {
      const gulf = CalculationMethod.Other();
      gulf.fajrAngle = 19.5;
      gulf.ishaAngle = 0;
      gulf.ishaInterval = 90;
      return gulf;
    }
    case 9:
      return CalculationMethod.Kuwait();
    case 10:
      return CalculationMethod.Qatar();
    case 11:
      return CalculationMethod.Singapore();
    case 13:
      return CalculationMethod.Turkey();
    case 15:
      return CalculationMethod.MoonsightingCommittee();
    case 16:
      return CalculationMethod.Dubai();
    default:
      throw new Error("The selected prayer calculation method is not supported.");
  }
}

function getHighLatitudeRule(ruleId: AppSettings["latitudeAdjustmentMethod"]) {
  if (ruleId === 1) return HighLatitudeRule.MiddleOfTheNight;
  if (ruleId === 2) return HighLatitudeRule.SeventhOfTheNight;
  return HighLatitudeRule.TwilightAngle;
}

function getDateParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value)
  };
}

export function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  const { year, month, day } = getDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(
    shifted.getUTCDate()
  ).padStart(2, "0")}`;
}

function dateFromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function getHijriDate(date: Date, timeZone: string): PrayerDay["hijriDate"] {
  try {
    const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-civil", {
      timeZone,
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const parts = formatter.formatToParts(date);
    const month = parts.find((part) => part.type === "month")?.value || "";
    return {
      day: parts.find((part) => part.type === "day")?.value || "",
      month,
      year: parts.find((part) => part.type === "year")?.value || "",
      isRamadan: month.toLowerCase().includes("ramadan")
    };
  } catch {
    return { day: "", month: "", year: "", isRamadan: false };
  }
}

function assertValidInstant(value: Date, name: string): Date {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
    throw new Error(`${name} could not be calculated for this location and date.`);
  }
  return value;
}

export function calculatePrayerDay(
  location: AppLocation,
  settings: AppSettings,
  dateKey: string
): PrayerDay {
  const coordinates = new Coordinates(location.lat, location.lng);
  const methodId = getResolvedMethodId(settings.method, location.countryCode, location.timeZone);
  const parameters = getCalculationParameters(methodId);
  parameters.madhab = settings.school === 1 ? Madhab.Hanafi : Madhab.Shafi;
  parameters.highLatitudeRule = getHighLatitudeRule(settings.latitudeAdjustmentMethod);
  parameters.polarCircleResolution = PolarCircleResolution.AqrabYaum;

  const calculationDate = dateFromDateKey(dateKey);
  const tomorrowDate = dateFromDateKey(addDaysToDateKey(dateKey, 1));
  const prayerTimes = new PrayerTimes(coordinates, calculationDate, parameters);
  const tomorrow = new PrayerTimes(coordinates, tomorrowDate, parameters);

  const midnightEnd = settings.midnightMode === 1 ? tomorrow.fajr : tomorrow.sunrise;
  const sunset = assertValidInstant(prayerTimes.sunset, "Sunset");
  const midnightEndInstant = assertValidInstant(midnightEnd, "Islamic midnight");
  const midnight = new Date(sunset.getTime() + (midnightEndInstant.getTime() - sunset.getTime()) / 2);

  const instants = {
    Fajr: assertValidInstant(prayerTimes.fajr, "Fajr"),
    Sunrise: assertValidInstant(prayerTimes.sunrise, "Sunrise"),
    Dhuhr: assertValidInstant(prayerTimes.dhuhr, "Dhuhr"),
    Asr: assertValidInstant(prayerTimes.asr, "Asr"),
    Maghrib: assertValidInstant(prayerTimes.maghrib, "Maghrib"),
    Isha: assertValidInstant(prayerTimes.isha, "Isha"),
    Midnight: assertValidInstant(midnight, "Islamic midnight")
  } satisfies Record<PrayerEvent | "Midnight", Date>;

  const methodName = CALCULATION_METHODS.find((item) => item.id === methodId)?.name ?? "Custom";

  return {
    dateKey,
    timeZone: location.timeZone,
    methodId,
    methodName,
    instants,
    hijriDate: getHijriDate(new Date(instants.Dhuhr.getTime() + (settings.hijriAdjustmentDays || 0) * 86400000), location.timeZone)
  };
}

export function calculatePrayerCalendar(
  location: AppLocation,
  settings: AppSettings,
  referenceDate = new Date(),
  daysBefore = 1,
  daysAfter = 8
): PrayerDay[] {
  const referenceKey = getDateKeyInTimeZone(referenceDate, location.timeZone);
  const calendar: PrayerDay[] = [];

  for (let offset = -daysBefore; offset <= daysAfter; offset += 1) {
    calendar.push(calculatePrayerDay(location, settings, addDaysToDateKey(referenceKey, offset)));
  }

  return calendar;
}
