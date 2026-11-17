import assert from "node:assert/strict";
import test from "node:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearRecentLocationHistory, loadPersistedState, saveSettings } from "../src/services/storage";
import { DEFAULT_SETTINGS } from "../src/constants/settings";

test("history cleanup removes only retired history and preserves selected location and other app data", async t => {
  const location = { name: "Sylhet", lat: 24.8949, lng: 91.8687, timeZone: "Asia/Dhaka", source: "manual", capturedAt: 1 };
  const data = new Map([
    ["@PrayerTime:v2:location", JSON.stringify(location)],
    ["@PrayerTime:v2:settings", JSON.stringify(DEFAULT_SETTINGS)],
    ["@PrayerTime:v2:tasbeeh", "saved-counter"],
    ["@PrayerTime:v2:recentLocations", "malformed-history"],
    ["@PrayerTime:recentLocations", "legacy-history"],
  ]);
  t.mock.method(AsyncStorage, "multiGet", async (keys: string[]) => {
    assert.ok(keys.every(key => !key.endsWith("recentLocations")), "restore no longer reads retired history");
    return keys.map(key => [key, data.get(key) ?? null]);
  });
  t.mock.method(AsyncStorage, "multiRemove", async (keys: string[]) => { for (const key of keys) data.delete(key); });
  const restored = await loadPersistedState();
  assert.equal(restored.location?.name, "Sylhet");
  await clearRecentLocationHistory();
  assert.deepEqual([...data.keys()].sort(), ["@PrayerTime:v2:location", "@PrayerTime:v2:settings", "@PrayerTime:v2:tasbeeh"]);
});

test("failed optional history cleanup does not reject or block later settings writes", async t => {
  t.mock.method(AsyncStorage, "getItem", async () => null);
  t.mock.method(AsyncStorage, "multiRemove", async () => { throw new Error("Storage unavailable"); });
  t.mock.method(console, "warn", () => undefined);
  let written = false;
  t.mock.method(AsyncStorage, "setItem", async () => { written = true; });
  await assert.doesNotReject(clearRecentLocationHistory());
  await saveSettings(DEFAULT_SETTINGS);
  assert.equal(written, true);
});

test("a stalled history removal cannot hold the settings write queue", async t => {
  t.mock.method(AsyncStorage, "getItem", async () => null);
  let finish!: () => void;
  t.mock.method(AsyncStorage, "multiRemove", () => new Promise<void>(resolve => { finish = resolve; }));
  let written = false;
  t.mock.method(AsyncStorage, "setItem", async () => { written = true; });
  const cleanup = clearRecentLocationHistory();
  await saveSettings(DEFAULT_SETTINGS);
  assert.equal(written, true);
  finish();
  await cleanup;
});
