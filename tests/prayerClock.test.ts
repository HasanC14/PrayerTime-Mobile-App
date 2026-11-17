import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import { calculatePrayerCalendar } from "../src/services/prayerTimes";
import { prayerClockDelay } from "../src/services/prayerClock";
import { getPrayerFocus } from "../src/services/prayerPeriods";
import { getCurrentPrayerGuidance, getPrayerGuidanceWindows } from "../src/utils/time";

const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, DEFAULT_SETTINGS, new Date("2026-11-04T00:00:00Z"), 1, 3);
const day = calendar.find(day => day.dateKey === "2026-11-04")!;

test("a boundary crossed between rendering and timer setup triggers immediate catch-up", () => {
  for (const window of getPrayerGuidanceWindows(day)) {
    const renderedAt = new Date(window.end.getTime() - 100);
    const wallTime = window.end.getTime() + 34_000;
    assert.equal(prayerClockDelay(renderedAt, calendar, wallTime), 1);
    assert.equal(getCurrentPrayerGuidance(new Date(wallTime), day), null);
    assert.ok(getPrayerFocus(new Date(wallTime), calendar)!.target.getTime() > wallTime);
  }
});

test("clock updates at each prayer and guidance transition, with a margin against early timers", () => {
  const boundaries = [day.instants.Fajr, day.instants.Asr, day.instants.Isha,
    ...getPrayerGuidanceWindows(day).flatMap(window => [window.start, window.end])];
  for (const boundary of boundaries) {
    const renderedAt = new Date(boundary.getTime() - 500);
    assert.equal(prayerClockDelay(renderedAt, calendar, renderedAt.getTime()), 525);
    assert.ok(prayerClockDelay(boundary, calendar, boundary.getTime()) > 1000);
  }
});

test("a delayed app wake catches up across several transitions and retains a heartbeat", () => {
  assert.equal(prayerClockDelay(day.instants.Fajr, calendar, day.instants.Maghrib.getTime()), 1);
  assert.equal(prayerClockDelay(new Date(), [], Date.now()), 30_000);
  assert.ok(prayerClockDelay(day.instants.Asr, calendar, day.instants.Asr.getTime() - 3600_000) <= 30_000);
});
