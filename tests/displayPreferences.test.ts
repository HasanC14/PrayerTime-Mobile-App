import assert from "node:assert/strict";
import test from "node:test";
import { normalizeTextScale } from "../src/typography";
import { DEFAULT_SETTINGS } from "../src/constants/settings";
import { validateSettings } from "../src/services/storage";
import { getCompassPresentation, getQiblaBearing, normalizeSignedAngle } from "../src/services/qibla";

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`);

test("text size restores a safe default for existing installs and bounds persisted values", () => {
  assert.equal(validateSettings({}).textScale, 1);
  assert.equal(normalizeTextScale(NaN), 1);
  assert.equal(normalizeTextScale(Infinity), 1);
  assert.equal(normalizeTextScale("large"), 1);
  assert.equal(normalizeTextScale(0), 0.9);
  assert.equal(normalizeTextScale(20), 1.4);
  assert.equal(normalizeTextScale(1.113), 1.1);
  assert.equal(validateSettings({ ...DEFAULT_SETTINGS, textScale: 1.35 }).textScale, 1.35);
});

test("north-up mode places the Dhaka Qibla arrow near west", () => {
  const bearing = getQiblaBearing({ lat: 23.8103, lng: 90.4125 })!;
  const view = getCompassPresentation(bearing, null);
  near(view.needleRotation, normalizeSignedAngle(bearing));
  const west = view.markers.find(marker => marker.direction === "W")!;
  near(west.x, -1); near(west.y, 0);
  const north = view.markers.find(marker => marker.direction === "N")!;
  near(north.x, 0); near(north.y, -1);
});

test("facing west rotates west to the top instead of incorrectly leaving north under the arrow", () => {
  const view = getCompassPresentation(278, 270);
  near(view.needleRotation, 8);
  const west = view.markers.find(marker => marker.direction === "W")!;
  near(west.x, 0); near(west.y, -1);
  const north = view.markers.find(marker => marker.direction === "N")!;
  near(north.x, 1); near(north.y, 0);
});

test("all cardinal labels and the needle share a coordinate frame for every phone heading", () => {
  for (const heading of [0, 45, 90, 180, 270, 278, 359, 361, -1]) {
    const view = getCompassPresentation(278, heading);
    near(view.needleRotation, normalizeSignedAngle(278 - heading));
    for (const marker of view.markers) {
      const bearing = { N: 0, E: 90, S: 180, W: 270 }[marker.direction];
      near(normalizeSignedAngle(Math.atan2(marker.x, -marker.y) * 180 / Math.PI - (bearing - heading)), 0);
    }
  }
});

test("Qibla is calculated for each location rather than hardcoded to west", () => {
  const london = getQiblaBearing({ lat: 51.5074, lng: -0.1278 })!;
  assert.ok(london > 110 && london < 130);
  near(getCompassPresentation(london, london).needleRotation, 0);
  assert.equal(getCompassPresentation(null, null).needleRotation, 0);
});
