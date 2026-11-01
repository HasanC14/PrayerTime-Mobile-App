import assert from "node:assert/strict";
import test from "node:test";
import { getStateFromPath } from "@react-navigation/core";
import { APP_LINKING_CONFIG } from "../src/navigation/routes";
import { getJournalDateKey, getJournalPeriod, getJournalPeriodSummary, getJournalReflection, getJournalStatus, moveJournalPeriod } from "../src/services/journalOverview";
import type { PrayerJournalDays } from "../src/services/prayerJournal";
import { calculatePrayerDay } from "../src/services/prayerTimes";
import { DEFAULT_SETTINGS } from "../src/constants/settings";
import { PRAYER_NAMES } from "../src/types";

const entry = {completedAt: Date.parse("2026-10-24T10:00Z"), timeZone: "Asia/Dhaka"};
const location = {name: "Dhaka", lat: 23.8103, lng: 90.4125, countryCode: "BD", timeZone: "Asia/Dhaka", source: "manual" as const, capturedAt: 1};

test("Home and Journal use the same prayer day through overnight Isha and Fajr", () => {
  const calendar = ["2026-10-23", "2026-10-24", "2026-10-25"].map(key => calculatePrayerDay(location, DEFAULT_SETTINGS, key));
  assert.equal(getJournalDateKey(new Date("2026-10-24T18:30Z"), calendar, location.timeZone), "2026-10-24");
  assert.equal(getJournalDateKey(calendar[2].instants.Fajr, calendar, location.timeZone), "2026-10-25");
  assert.equal(getJournalDateKey(new Date("2026-10-24T10:00Z"), calendar, location.timeZone), "2026-10-24");
});

test("base prayer status distinguishes unrecorded and upcoming; missed needs journal context", () => {
  const now = new Date("2026-10-24T10:00Z");
  assert.equal(getJournalStatus(false, now, now), "not-recorded");
  assert.equal(getJournalStatus(false, new Date(now.getTime() + 1), now), "upcoming");
  assert.equal(getJournalStatus(false, undefined, now), "unavailable");
  assert.equal(getJournalStatus(false, new Date(NaN), now), "unavailable");
  assert.equal(getJournalStatus(true, undefined, now), "recorded");
});

test("reflection surfaces the least recorded prayer in the last seven completed prayer days", () => {
  const days: PrayerJournalDays = {};
  for (let day = 17; day <= 23; day++) {
    days[`2026-10-${day}`] = Object.fromEntries(PRAYER_NAMES.filter(prayer => prayer !== "Fajr" || day < 19).map(prayer => [prayer, entry]));
  }
  days["2026-10-24"] = {Fajr: entry};
  days["2026-10-25"] = {Fajr: entry};
  assert.deepEqual(getJournalReflection(days, "2026-10-24"), {prayer: "Fajr", count: 2, days: 7});
});

test("reflection starts with actual history and waits for two completed days", () => {
  assert.equal(getJournalReflection({}, "2026-10-24"), null);
  assert.equal(getJournalReflection({"2026-10-24": {Fajr: entry}}, "2026-10-24"), null);
  assert.equal(getJournalReflection({"2026-10-23": {Fajr: entry}}, "2026-10-24"), null);
  assert.deepEqual(getJournalReflection({"2026-10-22": {Fajr: entry}, "2026-10-23": {Fajr: entry}}, "2026-10-24"), {prayer: "Dhuhr", count: 0, days: 2});
});

test("a journal with older history still reflects only the latest seven completed days", () => {
  const days: PrayerJournalDays = {"2026-01-01": {Fajr: entry}, "2026-10-23": {Isha: entry}};
  assert.deepEqual(getJournalReflection(days, "2026-10-24"), {prayer: "Fajr", count: 0, days: 7});
});

test("existing widget and reminder prayer deep links reach Prayer inside the new stack", () => {
  const state = getStateFromPath("prayer", APP_LINKING_CONFIG);
  assert.equal(state?.routes[0].name, "Main");
  assert.equal(state?.routes[0].state?.routes[0].name, "Prayer");
});

test("monthly summary shows 12 of 26 Fajr days and excludes today's and future entries", () => {
  const days: PrayerJournalDays = {};
  const counts = {Fajr: 12, Dhuhr: 20, Asr: 18, Maghrib: 17, Isha: 15};
  for (let day = 1; day <= 26; day++) days[`2026-10-${String(day).padStart(2, "0")}`] = Object.fromEntries(PRAYER_NAMES.filter(prayer => day <= counts[prayer]).map(prayer => [prayer, entry]));
  days["2026-10-27"] = Object.fromEntries(PRAYER_NAMES.map(prayer => [prayer, entry]));
  days["2026-10-31"] = {Fajr: entry};
  const result = getJournalPeriodSummary(days, "2026-10-27", "month", "2026-10-27", "2026-10-01");
  assert.equal(result.dayCount, 26);
  assert.equal(result.recorded, 82);
  assert.equal(result.total, 130);
  assert.equal(result.notRecorded, 48);
  assert.equal(result.lastIncluded, "2026-10-26");
  assert.deepEqual(result.prayers[0], {prayer: "Fajr", recorded: 12, total: 26, notRecorded: 14, missed: 13, unlogged: 1, progress: 12 / 26 * 100});
});

test("tracking starts mid-month and stays meaningful with no checkmarks or after all are undone", () => {
  const fresh = getJournalPeriodSummary({}, "2026-10-24", "month", "2026-10-24", "2026-10-24");
  assert.equal(fresh.total, 0);
  assert.equal(fresh.lastIncluded, null);
  assert.ok(fresh.prayers.every(prayer => prayer.progress === 0));
  const nextDay = getJournalPeriodSummary({}, "2026-10-25", "month", "2026-10-25", "2026-10-24");
  assert.equal(nextDay.dayCount, 1);
  assert.equal(nextDay.recorded, 0);
  assert.equal(nextDay.notRecorded, 5);
  assert.equal(nextDay.firstIncluded, "2026-10-24");
  assert.equal(getJournalPeriodSummary({}, "2026-09-01", "month", "2026-10-25", "2026-10-24").total, 0);
});

test("weekly totals cross year boundaries, exclude today, and respect the first tracked date", () => {
  const result = getJournalPeriodSummary({"2027-01-01": {Fajr: entry}, "2027-01-02": {Fajr: entry}, "2027-01-03": {Fajr: entry}}, "2027-01-03", "week", "2027-01-03", "2027-01-01");
  assert.equal(result.start, "2026-12-28");
  assert.equal(result.end, "2027-01-03");
  assert.equal(result.dayCount, 2);
  assert.equal(result.total, 10);
  assert.equal(result.recorded, 2);
});

test("legacy entries and deliberate backfilling extend coverage without rewriting the start date", () => {
  const result = getJournalPeriodSummary({"2026-10-17": {Isha: entry}}, "2026-10-24", "month", "2026-10-24", "2026-10-24");
  assert.equal(result.firstIncluded, "2026-10-17");
  assert.equal(result.dayCount, 7);
  assert.equal(result.recorded, 1);
  assert.equal(getJournalPeriodSummary({}, "2026-10-24", "month", "2026-10-24", null).total, 0);
});

test("calendar months handle leap years, varying lengths, and civil DST transitions", () => {
  for (const [month, end, count] of [["2028-02-10", "2028-02-29", 29], ["2027-02-10", "2027-02-28", 28], ["2026-03-10", "2026-03-31", 31], ["2026-04-10", "2026-04-30", 30]] as const) {
    const bounds = getJournalPeriod(month, "month");
    assert.equal(bounds.end, end);
    const result = getJournalPeriodSummary({}, month, "month", "2028-03-01", "2026-01-01");
    assert.equal(result.dayCount, count);
  }
});

test("month navigation clamps long days and safely crosses years", () => {
  assert.equal(moveJournalPeriod("2026-01-31", "month", 1), "2026-02-28");
  assert.equal(moveJournalPeriod("2028-01-31", "month", 1), "2028-02-29");
  assert.equal(moveJournalPeriod("2026-03-31", "month", -1), "2026-02-28");
  assert.equal(moveJournalPeriod("2026-12-24", "month", 1), "2027-01-24");
  assert.equal(moveJournalPeriod("2027-01-03", "week", -1), "2026-12-27");
});
