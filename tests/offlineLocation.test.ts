import assert from "node:assert/strict";
import test from "node:test";
import { createLocationNameResolver, LOCATION_NAME_RETRY_MS, mergeDeviceLocationName } from "../src/services/deviceLocationName";
import { calculatePrayerDay } from "../src/services/prayerTimes";
import { DEFAULT_SETTINGS } from "../src/constants/settings";
import type { AppLocation } from "../src/types";

const fix: AppLocation = {
  name: "Current location", lat: 23.8103, lng: 90.4125, timeZone: "Asia/Dhaka",
  source: "device", fixKind: "current", capturedAt: 1000, accuracy: 25,
};

test("failed city lookup leaves GPS coordinates usable for offline prayer calculation", async () => {
  const resolve = createLocationNameResolver(async () => { throw new Error("No internet"); });
  const location = await resolve(fix);
  assert.equal(location, fix);
  const day = calculatePrayerDay(location, DEFAULT_SETTINGS, "2026-10-19");
  assert.equal(day.methodId, 1);
  assert.equal(day.timeZone, "Asia/Dhaka");
  assert.ok(Number.isFinite(day.instants.Fajr.getTime()));
});

test("offline city lookups back off, keep applying newer GPS fixes, and recover later", async () => {
  let now = 0, calls = 0, online = false;
  const resolve = createLocationNameResolver(async () => {
    calls++;
    if (!online) throw new Error("Offline");
    return { name: "Dhaka, Bangladesh", countryCode: "BD" };
  }, () => now);
  await resolve(fix);
  const moved = { ...fix, lat: 24.1, capturedAt: 2000 };
  assert.equal(await resolve(moved), moved);
  assert.equal(calls, 1);
  online = true;
  now = LOCATION_NAME_RETRY_MS;
  const named = await resolve(moved);
  assert.equal(calls, 2);
  assert.equal(named.name, "Dhaka, Bangladesh");
  assert.equal(named.lat, moved.lat);
  assert.equal(named.capturedAt, moved.capturedAt);
});

test("a nearby saved city name is reused offline without a network request", async () => {
  let calls = 0;
  const resolve = createLocationNameResolver(async () => { calls++; throw new Error("Offline"); });
  const saved = { ...fix, name: "Dhaka, Bangladesh", countryCode: "BD" };
  assert.equal(await resolve(saved), saved);
  const nearby = { ...fix, lat: fix.lat + 0.0001, capturedAt: 2000 };
  const named = await resolve(nearby);
  assert.equal(named.name, saved.name);
  assert.equal(named.lat, nearby.lat);
  assert.equal(named.countryCode, "BD");
  assert.equal(calls, 0);
});

test("nearby concurrent GPS readings share a lookup and retain their own coordinates", async () => {
  let calls = 0;
  const resolve = createLocationNameResolver(async () => { calls++; return { name: "Dhaka, Bangladesh", countryCode: "BD" }; });
  const newer = { ...fix, lat: fix.lat + 0.0001, capturedAt: 2000 };
  const [first, second] = await Promise.all([resolve(fix), resolve(newer)]);
  assert.equal(calls, 1);
  assert.equal(first.lat, fix.lat);
  assert.equal(second.lat, newer.lat);
  assert.equal(second.capturedAt, newer.capturedAt);
});

test("travelling offline never reuses a distant city's name or country", async () => {
  const resolve = createLocationNameResolver(async () => { throw new Error("Offline"); });
  await resolve({ ...fix, name: "Dhaka, Bangladesh", countryCode: "BD" });
  const london = { ...fix, lat: 51.5074, lng: -0.1278, timeZone: "Europe/London", capturedAt: 2000 };
  assert.equal(await resolve(london), london);
  assert.equal(calculatePrayerDay(london, DEFAULT_SETTINGS, "2026-10-19").methodId, 3);
});

test("explicit refresh can retry a failed lookup before the automatic backoff expires", async () => {
  let online = false, calls = 0;
  const resolve = createLocationNameResolver(async () => {
    calls++;
    if (!online) throw new Error("Offline");
    return { name: "Dhaka, Bangladesh", countryCode: "BD" };
  }, () => 0);
  assert.equal(await resolve(fix), fix);
  online = true;
  assert.equal((await resolve(fix, { retryNow: true })).name, "Dhaka, Bangladesh");
  assert.equal(calls, 2);
});

test("a delayed name lookup labels the latest nearby fix without replacing its coordinates", () => {
  const current = { ...fix, lat: fix.lat + 0.0001, accuracy: 5, capturedAt: 2000 };
  const named = { ...fix, name: "Dhaka, Bangladesh", countryCode: "BD" };
  assert.deepEqual(mergeDeviceLocationName(current, fix, named), { ...current, name: named.name, countryCode: "BD" });
});

test("delayed naming preserves manual choices, distant fixes, and a name already resolved", () => {
  const named = { ...fix, name: "Dhaka, Bangladesh", countryCode: "BD" };
  for (const current of [
    { ...fix, source: "manual" as const },
    { ...fix, lat: 24.1 },
    { ...fix, timeZone: "UTC" },
    { ...fix, name: "A newer city label" },
    null
  ]) assert.equal(mergeDeviceLocationName(current, fix, named), current);
  assert.equal(mergeDeviceLocationName(fix, fix, fix), fix);
});

test("generic labels are retried rather than cached as resolved cities", async () => {
  const resolve = createLocationNameResolver(async () => ({ name: "Dhaka, Bangladesh" }));
  for (const name of ["Current location", " Saved location ", "Selected location", "current location"]) {
    assert.equal((await resolve({ ...fix, name })).name, "Dhaka, Bangladesh");
  }
});
