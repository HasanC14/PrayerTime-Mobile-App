import assert from "node:assert/strict";
import test from "node:test";
import { requestDeviceLocationAccess, type DeviceLocationAccessAdapter } from "../src/services/deviceLocationAccess";
import { toLocationIssue } from "../src/services/locationErrors";
import { waitForLocationFix, type PositionFix } from "../src/services/locationFix";
import { notificationAccessMessage, resolveNotificationAccess, type NotificationAccessAdapter, type PermissionSnapshot } from "../src/services/notificationAccess";
import { formatLocationAccuracy, locationSourceLabel } from "../src/utils/locationStatus";
import type { AppLocation } from "../src/types";

const allowed: PermissionSnapshot = { status: "granted", granted: true, canAskAgain: true };
const notRequested: PermissionSnapshot = { status: "undetermined", granted: false, canAskAgain: true };

function notificationAdapter(permission = notRequested, overrides: Partial<NotificationAccessAdapter> = {}) {
  const calls: string[] = [];
  const adapter: NotificationAccessAdapter = {
    platform: "android",
    prepareChannel: async () => { calls.push("channel"); },
    getPermission: async () => { calls.push("inspect"); return permission; },
    requestPermission: async () => { calls.push("request"); return allowed; },
    getChannel: async () => ({ importance: 4, sound: "default" }),
    ...overrides
  };
  return { calls, adapter };
}

test("explicit reminder enable creates the Android channel before requesting permission", async () => {
  const { adapter, calls } = notificationAdapter();
  assert.equal((await resolveNotificationAccess(adapter, true)).status, "granted");
  assert.deepEqual(calls, ["channel", "inspect", "request"]);
});

test("startup permission inspection never opens the notification prompt", async () => {
  const { adapter, calls } = notificationAdapter();
  assert.equal((await resolveNotificationAccess(adapter, false)).status, "undetermined");
  assert.deepEqual(calls, ["channel", "inspect"]);
});

test("existing Expo Go permission is reused without promising another OS prompt", async () => {
  const { adapter, calls } = notificationAdapter(allowed);
  assert.equal((await resolveNotificationAccess(adapter, true)).status, "granted");
  assert.equal(calls.includes("request"), false);
});

test("blocked Android access directs users to settings and does not request again", async () => {
  for (const permission of [
    { status: "denied", granted: false, canAskAgain: false },
    { status: "denied", granted: true, canAskAgain: true }
  ]) {
    const { adapter, calls } = notificationAdapter(permission);
    const access = await resolveNotificationAccess(adapter, true);
    assert.equal(access.status, "blocked");
    assert.match(notificationAccessMessage(access)!, /phone settings/);
    assert.equal(calls.includes("request"), false);
  }
});

test("a retryable denied notification request reports denial truthfully", async () => {
  const denied = { status: "denied", granted: false, canAskAgain: true };
  const { adapter, calls } = notificationAdapter(denied, { requestPermission: async () => { calls.push("request"); return denied; } });
  assert.equal((await resolveNotificationAccess(adapter, true)).status, "denied");
  assert.equal(calls.includes("request"), true);
});

test("Android channel blocking, silent sound, and absent banners are exposed", async () => {
  const { adapter } = notificationAdapter(allowed, { getChannel: async () => ({ importance: 0, sound: null }) });
  const access = await resolveNotificationAccess(adapter, false);
  assert.equal(access.channelBlocked, true);
  assert.equal(access.soundEnabled, false);
  assert.equal(access.bannersEnabled, false);
  assert.match(notificationAccessMessage(access)!, /channel is disabled/);
  const quiet = await resolveNotificationAccess({ ...adapter, getChannel: async () => ({ importance: 3, sound: "default" }) }, false);
  assert.match(notificationAccessMessage(quiet)!, /banners/);
});

test("web preview does not invoke native notification APIs", async () => {
  const { adapter, calls } = notificationAdapter(notRequested, { platform: "web" });
  assert.equal((await resolveNotificationAccess(adapter, true)).status, "unsupported");
  assert.deepEqual(calls, []);
});

test("iOS provisional notification access remains usable", async () => {
  const { adapter, calls } = notificationAdapter({ ...notRequested, ios: { status: 3, allowsSound: false, allowsAlert: false } }, { platform: "ios" });
  const access = await resolveNotificationAccess(adapter, true);
  assert.equal(access.status, "granted");
  assert.equal(access.soundEnabled, false);
  assert.equal(access.bannersEnabled, false);
  assert.equal(calls.includes("request"), false);
});

function locationAdapter(overrides: Partial<DeviceLocationAccessAdapter> = {}) {
  const calls: string[] = [];
  const adapter: DeviceLocationAccessAdapter = {
    getPermission: async () => { calls.push("inspect"); return notRequested; },
    requestPermission: async () => { calls.push("request"); return allowed; },
    offerLocationServices: async () => { calls.push("offer-services"); },
    servicesEnabled: async () => { calls.push("services"); return true; },
    ...overrides
  };
  return { calls, adapter };
}

test("manual location action requests permission before offering location accuracy settings", async () => {
  const { adapter, calls } = locationAdapter();
  await requestDeviceLocationAccess(adapter, true);
  assert.deepEqual(calls, ["inspect", "request", "offer-services", "services"]);
});

test("automatic location refresh never opens a native permission or accuracy dialog", async () => {
  const { adapter, calls } = locationAdapter({ getPermission: async () => allowed });
  await requestDeviceLocationAccess(adapter, false);
  assert.deepEqual(calls, ["services"]);
  await assert.rejects(requestDeviceLocationAccess({ ...adapter, getPermission: async () => notRequested }, false), { code: "permission-denied" });
});

test("blocked location permission does not reach service lookup or prompt", async () => {
  const { adapter, calls } = locationAdapter({ getPermission: async () => ({ status: "denied", canAskAgain: false }) });
  await assert.rejects(requestDeviceLocationAccess(adapter, true), { code: "permission-blocked", canOpenSettings: true });
  assert.deepEqual(calls, []);
});

test("declining optional network accuracy still permits a GPS-only fix", async () => {
  const { adapter } = locationAdapter({ getPermission: async () => allowed, offerLocationServices: async () => { throw new Error("declined"); } });
  await requestDeviceLocationAccess(adapter, true);
});

test("disabled phone location has an actionable error", async () => {
  const { adapter } = locationAdapter({ getPermission: async () => allowed, servicesEnabled: async () => false });
  await assert.rejects(requestDeviceLocationAccess(adapter, false), { code: "services-disabled", canOpenSettings: true });
  assert.equal(toLocationIssue({ code: "ERR_LOCATION_SETTINGS_UNSATISFIED" }).code, "settings-unsatisfied");
  assert.match(toLocationIssue({ code: "ERR_LOCATION_SETTINGS_UNSATISFIED" }).message, /Location Accuracy/);
});

const fix: PositionFix = { coords: { latitude: 23.8103, longitude: 90.4125, accuracy: 50 }, timestamp: Date.now() };

test("first fresh position removes the native watch even when delivered before subscription resolves", async () => {
  let removed = 0;
  const result = await waitForLocationFix(async (onFix) => { onFix(fix); return { remove: () => { removed++; } }; }, 1000);
  await Promise.resolve();
  assert.equal(result, fix);
  assert.equal(removed, 1);
});

test("stale and invalid cached coordinates cannot masquerade as a current fix", async () => {
  const result = await waitForLocationFix(async (onFix) => {
    onFix({ ...fix, timestamp: fix.timestamp - 90_000 });
    onFix({ ...fix, coords: { latitude: 999, longitude: 90 } });
    onFix(fix);
    return { remove: () => undefined };
  }, 1000, undefined, fix.timestamp);
  assert.equal(result, fix);
});

test("timed-out location acquisition stops its battery-consuming native watch", async () => {
  let removed = 0;
  await assert.rejects(waitForLocationFix(async () => ({ remove: () => { removed++; } }), 10), { code: "timeout" });
  assert.equal(removed, 1);
});

test("selecting a manual city cancels a pending fix and cleans up a late native subscription", async () => {
  let onSubscribed: ((value: { remove: () => void }) => void) | undefined;
  let removed = 0;
  const controller = new AbortController();
  const pending = waitForLocationFix(() => new Promise((resolve) => { onSubscribed = resolve; }), 1000, controller.signal);
  controller.abort();
  await assert.rejects(pending, /cancelled/);
  onSubscribed!({ remove: () => { removed++; } });
  await Promise.resolve();
  assert.equal(removed, 1);
});

test("native errors, synchronous setup errors, and cleanup errors settle the location request", async () => {
  const failure = new Error("native location error");
  let removed = 0;
  await assert.rejects(waitForLocationFix(async (_, onError) => { onError(failure); return { remove: () => { removed++; } }; }, 1000), failure);
  assert.equal(removed, 1);
  await assert.rejects(waitForLocationFix(() => { throw failure; }, 1000), failure);
  const result = await waitForLocationFix(async (onFix) => { setTimeout(() => onFix(fix), 1); return { remove: () => { throw failure; } }; }, 1000);
  assert.equal(result, fix);
});

test("a manual Dhaka selection, a cached fix, and a fresh phone fix have distinct labels", () => {
  const location: AppLocation = { name: "Dhaka", lat: 23.8103, lng: 90.4125, timeZone: "Asia/Dhaka", capturedAt: Date.now(), source: "manual" };
  assert.equal(locationSourceLabel(location), "Manual city · phone location off");
  assert.equal(locationSourceLabel({ ...location, source: "device", fixKind: "cached" }), "Cached phone fix");
  assert.equal(locationSourceLabel({ ...location, source: "device", fixKind: "current" }), "Phone location fix");
  assert.equal(formatLocationAccuracy(50), "Accuracy ±50 m");
  assert.equal(formatLocationAccuracy(5000), "Approximate · ±5.0 km");
});
