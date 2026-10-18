import assert from "node:assert/strict";
import test from "node:test";

import { getMonthGrid } from "../src/services/calendar";
import { addDaysToDateKey } from "../src/services/prayerTimes";
import {
  getCompassDirection,
  getQiblaBearing,
  normalizeDegrees,
  normalizeSignedAngle
} from "../src/services/qibla";

test("Qibla bearings match known cities", () => {
  const dhaka = getQiblaBearing({ lat: 23.8103, lng: 90.4125 });
  const london = getQiblaBearing({ lat: 51.5074, lng: -0.1278 });

  assert.ok(dhaka !== null && Math.abs(dhaka - 277.57) < 0.2);
  assert.ok(london !== null && Math.abs(london - 118.99) < 0.2);
});

test("Qibla angle normalization follows the shortest turn across north", () => {
  assert.equal(normalizeSignedAngle(2 - 358), 4);
  assert.equal(normalizeSignedAngle(358 - 2), -4);
  assert.equal(normalizeDegrees(-1), 359);
  assert.equal(getCompassDirection(359), "N");
});

test("Qibla bearing is intentionally undefined at the Kaaba", () => {
  assert.equal(getQiblaBearing({ lat: 21.4225, lng: 39.8262 }), null);
});

test("calendar grid always returns 42 unique consecutive days", () => {
  const cells = getMonthGrid(2026, 6);
  assert.equal(cells.length, 42);
  assert.equal(new Set(cells.map((cell) => cell.dateKey)).size, 42);

  cells.slice(1).forEach((cell, index) => {
    assert.equal(cell.dateKey, addDaysToDateKey(cells[index].dateKey, 1));
  });
});

test("calendar grid handles leap-year February", () => {
  const cells = getMonthGrid(2028, 1);
  const leapDay = cells.find((cell) => cell.dateKey === "2028-02-29");
  assert.ok(leapDay?.inCurrentMonth);
});
