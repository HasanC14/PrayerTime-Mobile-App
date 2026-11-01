import assert from "node:assert/strict";
import test from "node:test";
import { getJournalDayStatus, getJournalPeriodSummary } from "../src/services/journalOverview";
import { getWeeklyReflection } from "../src/services/weeklyReflection";
import { PRAYER_PASSAGES } from "../src/content/prayerReflections";
import type { PrayerJournalDays } from "../src/services/prayerJournal";
import { PRAYER_NAMES } from "../src/types";
import { messages } from "../src/i18n/messages";
const entry = {completedAt: 1, timeZone: "Asia/Dhaka"};
const now = new Date("2026-11-02T10:00Z");
const activeKey = "2026-11-02";
const start = "2026-10-26";
function completeWeek(except?: string): PrayerJournalDays {
  const dates = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01"];
  return Object.fromEntries(dates.map(key => [key, Object.fromEntries(PRAYER_NAMES.filter(p => p !== except).map(p => [p, entry]))]));
}

test("empty weeks are unassessed; backfilling activates and updates missed totals", () => {
  const empty = getJournalPeriodSummary({}, start, "week", activeKey, start);
  assert.equal(empty.missed, 0);
  assert.equal(empty.unlogged, 35);
  assert.equal(empty.assessedTotal, 0);
  const updated = getJournalPeriodSummary({[start]: {Fajr: entry}}, start, "week", activeKey, start);
  assert.equal(updated.missed, 34);
  assert.equal(updated.unlogged, 0);
  assert.equal(updated.assessedTotal, 35);
  assert.equal(getWeeklyReflection({}, start, activeKey, start).theme, "starting");
  assert.equal(getWeeklyReflection({[start]: {Fajr: entry}}, start, activeKey, start).theme, "returning");
});

test("today and exempt records do not turn an empty week into missed prayers", () => {
  const days = {[activeKey]: {Fajr: entry}, [start]: {exempt: true, Fajr: entry}};
  const summary = getJournalPeriodSummary(days, start, "week", activeKey, start);
  assert.equal(summary.total, 30);
  assert.equal(summary.exemptDays, 1);
  assert.equal(summary.recorded, 0);
  assert.equal(summary.missed, 0);
  assert.equal(summary.unlogged, 30);
});

test("monthly reports preserve inactive weeks instead of converting them into misses", () => {
  const summary = getJournalPeriodSummary({[start]: {Fajr: entry}}, "2026-10-01", "month", activeKey, "2026-10-01");
  assert.equal(summary.total, 155);
  assert.equal(summary.recorded, 1);
  assert.equal(summary.missed, 29);
  assert.equal(summary.unlogged, 125);
  assert.equal(summary.missed + summary.unlogged + summary.recorded, summary.total);
});

test("day status requires a completed day and actual activity in that week", () => {
  const days = {[start]: {Fajr: entry}};
  const before = new Date("2026-10-27T10:00Z");
  assert.equal(getJournalDayStatus(days, "2026-10-27", "Dhuhr", before, now, activeKey, start), "missed");
  assert.equal(getJournalDayStatus({}, start, "Dhuhr", before, now, activeKey, start), "not-recorded");
  assert.equal(getJournalDayStatus(days, activeKey, "Dhuhr", before, now, activeKey, start), "not-recorded");
  assert.equal(getJournalDayStatus({[start]: {exempt: true, Fajr: entry}}, start, "Fajr", before, now, activeKey, start), "exempt");
  assert.equal(getJournalDayStatus(days, start, "Fajr", before, now, activeKey, start), "recorded");
});

test("reflections distinguish starting, rebuilding, and maintaining; meaningful gaps get a prayer tip", () => {
  assert.equal(getWeeklyReflection({}, activeKey, activeKey, activeKey).theme, "starting");
  assert.equal(getWeeklyReflection(completeWeek(), start, activeKey, start).theme, "maintaining");
  const days = completeWeek("Fajr");
  delete days["2026-10-27"].Dhuhr;
  delete days["2026-10-28"].Dhuhr;
  const reflection = getWeeklyReflection(days, start, activeKey, start);
  assert.equal(reflection.theme, "consistency");
  assert.equal(reflection.prayer, "Fajr");
  assert.equal(reflection.tip, "Prepare before bed and set an alarm for Fajr.");
  assert.equal(getWeeklyReflection({[start]: {Fajr: entry}}, start, activeKey, start).prayer, undefined);
});

test("all-exempt weeks show a neutral reflection and exclude every day", () => {
  const days = Object.fromEntries(Object.keys(completeWeek()).map(key => [key, {exempt: true}]));
  const reflection = getWeeklyReflection(days, start, activeKey, start);
  assert.equal(reflection.summary.total, 0);
  assert.equal(reflection.summary.missed, 0);
  assert.equal(reflection.reason, "Exempt days are left out of your prayer totals.");
});

test("weekly rotation is stable across reopens and changes in the following week", () => {
  const a = getWeeklyReflection({}, start, activeKey, start);
  assert.equal(a.passage.id, getWeeklyReflection({}, start, activeKey, start).passage.id);
  assert.notEqual(a.passage.id, getWeeklyReflection({}, activeKey, "2026-11-09", start).passage.id);
  for (const passage of PRAYER_PASSAGES) {
    assert.match(passage.url, /^https:\/\/(quran.com|sunnah.com)\//);
    assert.ok(passage.reference && passage.attribution && passage.themes.length);
  }
  for (const reflection of [a, getWeeklyReflection(completeWeek(), start, activeKey, start), getWeeklyReflection({[start]: {Fajr: entry}}, start, activeKey, start)]) {
    assert.ok(messages[reflection.reason]);
    assert.ok(messages[reflection.tip]);
  }
});

test("activity in a week crossing months gives the same missed status in both reports", () => {
  const days = {[start]: {Fajr: entry}};
  const monthly = getJournalPeriodSummary(days, "2026-11-01", "month", activeKey, start);
  const weekly = getJournalPeriodSummary(days, "2026-11-01", "week", activeKey, start);
  assert.equal(monthly.missed, 5);
  assert.equal(monthly.unlogged, 0);
  assert.equal(weekly.missed, 34);
  assert.equal(getJournalDayStatus(days, "2026-11-01", "Fajr", now, now, activeKey, start), "missed");
});
