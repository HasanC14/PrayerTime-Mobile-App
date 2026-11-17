import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_PRAYER_ALARMS, DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import {
  getPrayerAlarmOccurrences,
  getCurrentPrayerPeriod,
  getPrayerFocus,
  getPrayerPeriods,
  getPrayerPeriodsForDate
} from "../src/services/prayerPeriods";
import { validateLocation, validateSettings } from "../src/services/storage";
import type { PrayerAlarmSettings, PrayerDay } from "../src/types";
import {
  getCurrentPrayerGuidance,
  getNextPrayerGuidanceBoundary,
  getPrayerGuidanceWindows,
  getSalatudDohaWindow,
} from "../src/utils/time";

function instant(value: string): Date {
  return new Date(value);
}

test("restored coordinates are cached, and missing or legacy silent Dhaka never imply a new detection", () => {
  assert.equal(validateLocation(null), null);
  assert.equal(validateLocation({ lat: FALLBACK_LOCATION.lat, lng: FALLBACK_LOCATION.lng, name: "Dhaka" }), null);
  const saved = { lat: 23.8103, lng: 90.4125, name: "Dhaka", source: "device", fixKind: "current", capturedAt: 1000 };
  assert.equal(validateLocation(saved)?.fixKind, "cached");
  assert.equal(validateLocation({ ...saved, source: "manual" })?.source, "manual");
});

function makeDay(dateKey: string, day: string, nextDay: string): PrayerDay {
  return {
    dateKey,
    timeZone: "UTC",
    methodId: 3,
    methodName: "Test",
    instants: {
      Fajr: instant(`${day}T04:00:00Z`),
      Sunrise: instant(`${day}T05:30:00Z`),
      Dhuhr: instant(`${day}T12:00:00Z`),
      Asr: instant(`${day}T15:30:00Z`),
      Maghrib: instant(`${day}T18:00:00Z`),
      Isha: instant(`${day}T19:30:00Z`),
      Midnight: instant(`${nextDay}T00:00:00Z`)
    },
    hijriDate: { day: "1", month: "Test", year: "1448", isRamadan: false }
  };
}

const calendar = [
  makeDay("2026-07-12", "2026-07-12", "2026-07-13"),
  makeDay("2026-07-13", "2026-07-13", "2026-07-14")
];

test("current prayer follows each active period rather than the upcoming prayer", () => {
  for (const period of getPrayerPeriods(calendar).filter(period => period.dateKey === calendar[0].dateKey)) {
    assert.equal(getCurrentPrayerPeriod(period.start, calendar)?.prayer, period.prayer);
    assert.equal(getCurrentPrayerPeriod(new Date(period.end.getTime() - 1), calendar)?.prayer, period.prayer);
    assert.notEqual(getCurrentPrayerPeriod(period.end, calendar)?.prayer, period.prayer);
  }
  assert.equal(getCurrentPrayerPeriod(instant("2026-07-12T07:00:00Z"), calendar), null);
});

test("Isha stays current across midnight and yields to Fajr at its exact start", () => {
  for (const value of ["2026-07-12T20:00:00Z", "2026-07-12T23:59:59Z", "2026-07-13T00:00:00Z", "2026-07-13T03:59:59Z"]) {
    const active = getCurrentPrayerPeriod(instant(value), calendar);
    assert.equal(active?.prayer, "Isha");
    assert.equal(active?.dateKey, "2026-07-12");
    assert.equal(active?.end.toISOString(), "2026-07-13T04:00:00.000Z");
  }
  assert.equal(getCurrentPrayerPeriod(instant("2026-07-13T04:00:00Z"), calendar)?.prayer, "Fajr");
});

test("calendar selection keeps the selected day's times when tomorrow is included for Isha", () => {
  const periods = getPrayerPeriodsForDate(calendar, "2026-07-12");
  assert.equal(periods.size, 5);
  assert.equal(periods.get("Fajr")?.start.toISOString(), "2026-07-12T04:00:00.000Z");
  assert.equal(periods.get("Dhuhr")?.start.toISOString(), "2026-07-12T12:00:00.000Z");
  assert.equal(periods.get("Isha")?.end.toISOString(), "2026-07-13T04:00:00.000Z");
});

test("prayer periods use the correct end event, including next-day Fajr for Isha", () => {
  const periods = getPrayerPeriods(calendar).filter((period) => period.dateKey === "2026-07-12");
  const byPrayer = new Map(periods.map((period) => [period.prayer, period]));

  assert.equal(byPrayer.get("Fajr")?.end.toISOString(), "2026-07-12T05:30:00.000Z");
  assert.equal(byPrayer.get("Dhuhr")?.end.toISOString(), "2026-07-12T15:30:00.000Z");
  assert.equal(byPrayer.get("Asr")?.end.toISOString(), "2026-07-12T18:00:00.000Z");
  assert.equal(byPrayer.get("Maghrib")?.end.toISOString(), "2026-07-12T19:30:00.000Z");
  assert.equal(byPrayer.get("Isha")?.end.toISOString(), "2026-07-13T04:00:00.000Z");
});

test("per-prayer alarm is scheduled by subtracting its configured lead time", () => {
  const alarms: PrayerAlarmSettings = {
    Fajr: null,
    Dhuhr: null,
    Asr: 30,
    Maghrib: null,
    Isha: null
  };
  const occurrences = getPrayerAlarmOccurrences(calendar, alarms, instant("2026-07-12T00:00:00Z"));

  assert.equal(occurrences.length, 2);
  assert.equal(occurrences[0].prayer, "Asr");
  assert.equal(occurrences[0].trigger.toISOString(), "2026-07-12T17:30:00.000Z");
  assert.equal(occurrences[0].periodEnd.toISOString(), "2026-07-12T18:00:00.000Z");
});

test("focus highlights an active prayer ending and the post-sunrise wait correctly", () => {
  const asr = getPrayerFocus(instant("2026-07-12T16:00:00Z"), calendar);
  assert.equal(asr?.prayer, "Asr");
  assert.equal(asr?.phase, "ends");
  assert.equal(asr?.target.toISOString(), "2026-07-12T18:00:00.000Z");

  const afterSunrise = getPrayerFocus(instant("2026-07-12T07:00:00Z"), calendar);
  assert.equal(afterSunrise?.prayer, "Salatud Doha");
  assert.equal(afterSunrise?.phase, "ends");
  assert.equal(afterSunrise?.target.toISOString(), "2026-07-12T11:54:00.000Z");
  assert.equal(afterSunrise?.startLabel, "Salatud Doha");
});

test("Salatud Doha begins after sunrise prohibition and ends before solar noon prohibition", () => {
  const window = getSalatudDohaWindow(calendar[0]);

  assert.equal(window.start.toISOString(), "2026-07-12T05:45:00.000Z");
  assert.equal(window.end.toISOString(), "2026-07-12T11:54:00.000Z");
  assert.equal(getPrayerFocus(instant("2026-07-12T05:44:59Z"), calendar)?.prayer, "Dhuhr");
  assert.equal(getPrayerFocus(window.start, calendar)?.prayer, "Salatud Doha");
  assert.equal(getPrayerFocus(window.end, calendar)?.prayer, "Dhuhr");
});

test("avoided-prayer guidance exposes explicit start and end ranges", () => {
  const windows = getPrayerGuidanceWindows(calendar[0]);
  assert.deepEqual(
    windows.map((window) => [window.key, window.start.toISOString(), window.end.toISOString()]),
    [
      ["sunrise", "2026-07-12T05:30:00.000Z", "2026-07-12T05:45:00.000Z"],
      ["solar-noon", "2026-07-12T11:54:00.000Z", "2026-07-12T12:00:00.000Z"],
      ["sunset", "2026-07-12T17:45:00.000Z", "2026-07-12T18:00:00.000Z"]
    ]
  );
});

test("prohibited windows include their start and exclude their end, with exact next boundaries", () => {
  for (const window of getPrayerGuidanceWindows(calendar[0])) {
    const before = new Date(window.start.getTime() - 1);
    assert.equal(getCurrentPrayerGuidance(before, calendar[0]), null);
    assert.equal(getCurrentPrayerGuidance(window.start, calendar[0])?.key, window.key);
    assert.equal(getCurrentPrayerGuidance(new Date(window.end.getTime() - 1), calendar[0])?.key, window.key);
    assert.equal(getCurrentPrayerGuidance(window.end, calendar[0]), null);
    assert.equal(getNextPrayerGuidanceBoundary(before, calendar)?.getTime(), window.start.getTime());
    assert.equal(getNextPrayerGuidanceBoundary(window.start, calendar)?.getTime(), window.end.getTime());
  }
  assert.equal(getNextPrayerGuidanceBoundary(new Date("2027-01-01T00:00:00Z"), calendar), null);
});

test("active prohibited-time guidance retains the countdown target", () => {
  const guidance = getCurrentPrayerGuidance(
    instant("2026-07-12T05:35:00Z"),
    calendar[0],
  );

  assert.equal(guidance?.key, "sunrise");
  assert.equal(guidance?.end.toISOString(), "2026-07-12T05:45:00.000Z");
});

test("stored per-prayer alarms migrate to the global lead time", () => {
  const settings = validateSettings({
    ...DEFAULT_SETTINGS,
    alarmLeadMinutes: 20,
    prayerAlarmMinutes: { Fajr: null, Dhuhr: 40, Asr: 90, Maghrib: "30" }
  });

  assert.equal(settings.alarmLeadMinutes, 20);
  assert.equal(settings.prayerAlarmMinutes.Fajr, null);
  assert.equal(settings.prayerAlarmMinutes.Dhuhr, 20);
  assert.equal(settings.prayerAlarmMinutes.Asr, 20);
  assert.equal(settings.prayerAlarmMinutes.Maghrib, 20);
  assert.equal(settings.prayerAlarmMinutes.Isha, 20);
});

test("appearance settings accept dark mode and repair unknown values", () => {
  assert.equal(validateSettings({ ...DEFAULT_SETTINGS, themeMode: "dark" }).themeMode, "dark");
  assert.equal(validateSettings({ ...DEFAULT_SETTINGS, themeMode: "classic-dark" }).themeMode, "classic-dark");
  assert.equal(validateSettings({ ...DEFAULT_SETTINGS, themeMode: "neon" }).themeMode, "light");
});
