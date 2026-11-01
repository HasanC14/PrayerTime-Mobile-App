import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import {
  calculatePrayerCalendar,
  calculatePrayerDay,
  getResolvedMethodId
} from "../src/services/prayerTimes";
import { validateLocation } from "../src/services/storage";
import type { AppLocation, AppSettings } from "../src/types";
import { formatPrayerTime, formatPrayerTimeRange, getPrayerState } from "../src/utils/time";

const settings: AppSettings = { ...DEFAULT_SETTINGS };

test("automatic calculation resolves to a country-appropriate method", () => {
  assert.equal(getResolvedMethodId("auto", "BD"), 1);
  assert.equal(getResolvedMethodId("auto", "SA"), 4);
  assert.equal(getResolvedMethodId("auto", "AE"), 16);
  assert.equal(getResolvedMethodId("auto", undefined), 3);
  assert.equal(getResolvedMethodId("auto", undefined, "Asia/Dhaka"), 1);
});

test("invalid persisted timezones are repaired from coordinates", () => {
  const location = validateLocation({
    name: "Dhaka",
    lat: 23.8103,
    lng: 90.4125,
    source: "manual",
    timeZone: "Not/A_Timezone",
    capturedAt: 0
  });

  assert.equal(location?.timeZone, "Asia/Dhaka");
});

test("Dhaka prayer day contains valid ordered instants", () => {
  const day = calculatePrayerDay(FALLBACK_LOCATION, settings, "2026-07-12");
  const ordered = [
    day.instants.Fajr,
    day.instants.Sunrise,
    day.instants.Dhuhr,
    day.instants.Asr,
    day.instants.Maghrib,
    day.instants.Isha
  ];

  assert.equal(day.methodId, 1);
  assert.equal(day.timeZone, "Asia/Dhaka");
  assert.ok(ordered.every((instant) => Number.isFinite(instant.getTime())));
  assert.ok(ordered.every((instant, index) => index === 0 || instant > ordered[index - 1]));
});

test("zero-degree coordinates and polar locations resolve without NaN", () => {
  const zero: AppLocation = {
    name: "Null Island",
    lat: 0,
    lng: 0,
    source: "manual",
    timeZone: "Etc/GMT",
    capturedAt: 0
  };
  const tromso: AppLocation = {
    name: "Tromsø, Norway",
    lat: 69.6492,
    lng: 18.9553,
    source: "manual",
    countryCode: "NO",
    timeZone: "Europe/Oslo",
    capturedAt: 0
  };

  const zeroDay = calculatePrayerDay(zero, settings, "2026-03-20");
  const polarDay = calculatePrayerDay(tromso, settings, "2026-06-21");

  assert.ok(Number.isFinite(zeroDay.instants.Fajr.getTime()));
  assert.ok(Number.isFinite(polarDay.instants.Sunrise.getTime()));
  assert.ok(Number.isFinite(polarDay.instants.Isha.getTime()));
});

test("next prayer uses the following day's actual Fajr occurrence", () => {
  const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, settings, new Date("2026-07-12T18:00:00Z"), 1, 2);
  const currentDay = calendar.find((day) => day.dateKey === "2026-07-12");
  const followingDay = calendar.find((day) => day.dateKey === "2026-07-13");
  assert.ok(currentDay);
  assert.ok(followingDay);

  const afterIsha = new Date(currentDay.instants.Isha.getTime() + 10 * 60_000);
  const state = getPrayerState(afterIsha, calendar);

  assert.equal(state.previous?.name, "Isha");
  assert.equal(state.next?.name, "Fajr");
  assert.equal(state.next?.date.getTime(), followingDay.instants.Fajr.getTime());
});

test("time formatting honors the selected location timezone", () => {
  const instant = new Date("2026-07-12T12:00:00Z");
  const dhaka = formatPrayerTime(instant, "24h", "Asia/Dhaka");
  const london = formatPrayerTime(instant, "24h", "Europe/London");
  assert.notEqual(dhaka, london);
});

test("time ranges share a matching AM/PM marker for a compact display", () => {
  const start = new Date("2026-07-12T03:53:00Z");
  const end = new Date("2026-07-12T05:19:00Z");

  assert.equal(formatPrayerTimeRange(start, end, "12h", "UTC"), "3:53 – 5:19 AM");
  assert.equal(formatPrayerTimeRange(start, end, "24h", "UTC"), "03:53 – 05:19");
  assert.equal(formatPrayerTimeRange(new Date("2026-07-12T05:59:00Z"), new Date("2026-07-12T06:12:00Z"), "12h", "UTC"), "5:59 – 6:12 AM");
  assert.equal(formatPrayerTimeRange(new Date("2026-07-12T11:59:00Z"), new Date("2026-07-12T12:04:00Z"), "12h", "UTC"), "11:59 AM – 12:04 PM");
});

test("Gulf Region is implemented rather than silently falling back", () => {
  const gulfSettings: AppSettings = { ...settings, method: 8 };
  const gulfDay = calculatePrayerDay(
    {
      name: "Manama, Bahrain",
      lat: 26.2235,
      lng: 50.5876,
      source: "manual",
      countryCode: "BH",
      timeZone: "Asia/Bahrain",
      capturedAt: 0
    },
    gulfSettings,
    "2026-07-12"
  );
  assert.equal(gulfDay.methodId, 8);
  assert.equal(gulfDay.methodName, "Gulf Region");
});
