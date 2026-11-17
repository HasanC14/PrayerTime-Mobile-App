import assert from "node:assert/strict";
import test from "node:test";
import {DEFAULT_SETTINGS, FALLBACK_LOCATION} from "../src/constants/settings";
import {refreshSavedSchedule} from "../src/services/backgroundSchedule";
import {getNotificationCoverage, parseNotificationCoverage} from "../src/services/notificationCoverage";
import {widgetSettingsKey} from "../src/services/widgetInputs";
import {getDiagnostics, recordDiagnostic} from "../src/services/diagnostics";
import {calculatePrayerDay} from "../src/services/prayerTimes";
import {validateSettings} from "../src/services/storage";

test("background refresh checks persisted opt-in, does not prompt, and never calculates without a saved location", async () => {
  let schedules = 0, cancels = 0, widgets = 0;
  let settings = {...DEFAULT_SETTINGS};
  let location: typeof FALLBACK_LOCATION | null = FALLBACK_LOCATION;
  const ports = {
    load: async () => ({settings, location}),
    cancel: async () => {cancels++;},
    calendar: () => [],
    schedule: async (_calendar: unknown, _settings: unknown, permission: false) => {assert.equal(permission, false); schedules++; return {scheduled: true};},
    widgets: async () => {widgets++;},
  };
  assert.equal(await refreshSavedSchedule(ports), "success");
  assert.equal(cancels, 1); assert.equal(schedules, 0);
  settings = {...settings, prayerStartNotificationsEnabled: true};
  assert.equal(await refreshSavedSchedule(ports), "success");
  assert.equal(schedules, 1); assert.equal(widgets, 1);
  location = null;
  assert.equal(await refreshSavedSchedule(ports), "unavailable");
  assert.equal(schedules, 1);
  assert.equal(await refreshSavedSchedule({...ports, load: async () => {throw new Error("Disk unavailable");}}), "failed");
  assert.equal(schedules, 1);
});
test("denied notification access and publishing failures remain retryable", async () => {
  const ports = {
    load: async () => ({settings: {...DEFAULT_SETTINGS, notificationsEnabled: true}, location: FALLBACK_LOCATION}),
    cancel: async () => {}, calendar: () => [], schedule: async () => ({scheduled: false}), widgets: async () => {},
  };
  assert.equal(await refreshSavedSchedule(ports), "unavailable");
  assert.equal(await refreshSavedSchedule({...ports, schedule: async () => ({scheduled: true}), widgets: async () => {throw new Error("Storage unavailable");}}), "failed");
});
test("coverage reflects only valid scheduled future instants", () => {
  assert.deepEqual(getNotificationCoverage([new Date(90), new Date(110), new Date(120), new Date(NaN)], 100), {updatedAt: 100, until: 120, count: 2});
  assert.deepEqual(getNotificationCoverage([], 100), {updatedAt: 100, until: 100, count: 0});
});
test("damaged coverage metadata cannot reach the date formatter", () => {
  for (const raw of [null, "{bad", "null", "[]", JSON.stringify({updatedAt: 100, until: Number.MAX_VALUE, count: 1}), JSON.stringify({updatedAt: 100, until: 90, count: 1})]) assert.equal(parseNotificationCoverage(raw), null);
  assert.deepEqual(parseNotificationCoverage(JSON.stringify({updatedAt: 100, until: 120, count: 2, ignored: "extra"})), {updatedAt: 100, until: 120, count: 2});
});
test("irrelevant preference changes do not rebuild widget timelines", () => {
  const key = widgetSettingsKey(DEFAULT_SETTINGS);
  assert.equal(widgetSettingsKey({...DEFAULT_SETTINGS, notificationsEnabled: true, prayerTrackingEnabled: true, alarmLeadMinutes: 30}), key);
  for (const change of [{language: "bn" as const}, {themeMode: "dark" as const}, {hijriAdjustmentDays: 1}, {timeFormat: "24h" as const}, {ramadanMode: "always" as const}]) assert.notEqual(widgetSettingsKey({...DEFAULT_SETTINGS, ...change}), key);
});
test("Hijri adjustment changes the displayed date, including Ramadan, without moving prayer times", () => {
  const normal = calculatePrayerDay(FALLBACK_LOCATION, DEFAULT_SETTINGS, "2026-02-17");
  for (const offset of [-2, -1, 1, 2]) {
    const shifted = calculatePrayerDay(FALLBACK_LOCATION, {...DEFAULT_SETTINGS, hijriAdjustmentDays: offset}, "2026-02-17");
    const comparison = calculatePrayerDay(FALLBACK_LOCATION, DEFAULT_SETTINGS, new Date(Date.parse("2026-02-17T12:00Z") + offset * 86400000).toISOString().slice(0, 10));
    assert.deepEqual(shifted.hijriDate, comparison.hijriDate);
    assert.deepEqual(shifted.instants, normal.instants);
  }
  for (const invalid of [3, -3, 1.5, "1", null]) assert.equal(validateSettings({hijriAdjustmentDays: invalid}).hijriAdjustmentDays, 0);
});
test("diagnostics are bounded, sanitized status/timing copies", () => {
  for (let index = 0; index < 35; index++) recordDiagnostic("widgets", "success", index + .4);
  const snapshot = getDiagnostics();
  assert.equal(snapshot.length, 30);
  assert.deepEqual(Object.keys(snapshot[0]).sort(), ["area", "at", "durationMs", "outcome"]);
  snapshot[0].outcome = "failed";
  assert.equal(getDiagnostics()[0].outcome, "success");
  recordDiagnostic("render", "failed", NaN);
  assert.equal(getDiagnostics().at(-1)?.durationMs, undefined);
});
