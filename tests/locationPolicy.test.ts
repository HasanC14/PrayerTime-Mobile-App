import assert from "node:assert/strict";
import test from "node:test";
import { distanceInMeters, LOCATION_STALE_MS, shouldApplyDeviceUpdate, shouldRestoreDeviceLocation } from "../src/services/locationPolicy";
import type { AppLocation } from "../src/types";

const dhaka: AppLocation = {
  name: "Dhaka", lat: 23.8103, lng: 90.4125, source: "device",
  timeZone: "Asia/Dhaka", capturedAt: 1_000_000, accuracy: 50
};

test("startup restores automatic location only for a saved device location", () => {
  assert.equal(shouldRestoreDeviceLocation(dhaka), true);
  assert.equal(shouldRestoreDeviceLocation({ ...dhaka, source: "manual" }), false);
  assert.equal(shouldRestoreDeviceLocation(null), false);
});

test("startup uses a recent saved device fix without requesting GPS again", () => {
  assert.equal(shouldRestoreDeviceLocation(dhaka, dhaka.capturedAt), false);
  assert.equal(shouldRestoreDeviceLocation(dhaka, dhaka.capturedAt + LOCATION_STALE_MS - 1), false);
  assert.equal(shouldRestoreDeviceLocation(dhaka, dhaka.capturedAt + LOCATION_STALE_MS), true);
});

test("live updates ignore GPS jitter and accept meaningful travel", () => {
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, lat: dhaka.lat + 0.0001, capturedAt: dhaka.capturedAt + 60_000 }), false);
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, lat: dhaka.lat + 0.02, capturedAt: dhaka.capturedAt + 60_000 }), true);
});

test("stale fixes refresh even at the same location; older fixes cannot replace newer ones", () => {
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, capturedAt: dhaka.capturedAt + LOCATION_STALE_MS }), true);
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, lat: 51.5, capturedAt: dhaka.capturedAt - 1 }), false);
});

test("approximate location jitter is filtered but an improved GPS fix is accepted", () => {
  const approximate = { ...dhaka, accuracy: 5000 };
  assert.equal(shouldApplyDeviceUpdate(approximate, { ...approximate, lat: dhaka.lat + 0.02, capturedAt: dhaka.capturedAt + 60_000 }), false);
  assert.equal(shouldApplyDeviceUpdate(approximate, { ...dhaka, capturedAt: dhaka.capturedAt + 60_000 }), true);
});

test("distance handles the international date line and identical coordinates", () => {
  assert.equal(distanceInMeters(dhaka, dhaka), 0);
  assert.ok(distanceInMeters({ lat: 0, lng: 179.999 }, { lat: 0, lng: -179.999 }) < 225);
});

test("crossing a timezone boundary updates calculations even with less than a kilometre of travel", () => {
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, timeZone: "Asia/Kolkata", capturedAt: dhaka.capturedAt + 60_000 }), true);
});

test("invalid live GPS coordinates and timestamps never replace a usable location", () => {
  for (const next of [{ ...dhaka, lat: NaN }, { ...dhaka, lng: Infinity }, { ...dhaka, lat: 91 }, { ...dhaka, capturedAt: NaN }]) {
    assert.equal(shouldApplyDeviceUpdate(dhaka, next), false);
    assert.equal(shouldApplyDeviceUpdate(null, next), false);
  }
});

test("unreported GPS accuracy cannot block a real location change", () => {
  assert.equal(shouldApplyDeviceUpdate(dhaka, { ...dhaka, lat: dhaka.lat + 0.02, accuracy: NaN, capturedAt: dhaka.capturedAt + 60_000 }), true);
});
