import assert from "node:assert/strict";
import test from "node:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {archiveDamagedValues, readSavedObject, DamagedSavedDataError} from "../src/services/recoverableStorage";
import {createPrayerJournalRepository, JOURNAL_PREFIX, JOURNAL_STARTED_ON_KEY} from "../src/services/prayerJournal";
import {getJournalDayStatus, getJournalPeriodSummary, getJournalReflection} from "../src/services/journalOverview";
import {loadPersistedState, saveSettings, saveTasbeehState, withSavedStorageLock} from "../src/services/storage";
import {DEFAULT_SETTINGS} from "../src/constants/settings";
import {notifyRecordsChanged} from "../src/services/recordChanges";

const entry = {completedAt: 1792836000000, timeZone: "Asia/Dhaka"};
function fixture(initial: [string, string][] = []) {
  const data = new Map(initial);
  const storage = {
    getItem: async (key: string) => data.get(key) ?? null,
    getAllKeys: async () => [...data.keys()],
    multiGet: async (keys: string[]) => keys.map(key => [key, data.get(key) ?? null] as const),
    setItem: async (key: string, value: string) => {data.set(key, value);},
    removeItem: async (key: string) => {data.delete(key);},
  };
  return {data, storage};
}
test("malformed JSON, null and arrays require explicit recovery; missing values remain valid", () => {
  for (const raw of ["{broken", "null", "[]", "false", '"text"']) assert.throws(() => readSavedObject(raw, "settings"), DamagedSavedDataError);
  assert.equal(readSavedObject(null, "settings"), null);
  assert.deepEqual(readSavedObject("{}", "settings"), {});
});
test("recovery archives exact bytes before removal and leaves healthy values untouched", async () => {
  const {data, storage} = fixture([["bad", "{broken"], ["good", "{}"]]);
  assert.equal(await archiveDamagedValues(storage, ["bad", "good"], 10), 1);
  assert.equal(data.get("@PrayerTime:v2:recovery:10:bad"), "{broken");
  assert.equal(data.get("good"), "{}");
  assert.equal(data.has("bad"), false);
});
test("a failed archive never deletes the only copy", async () => {
  const {data, storage} = fixture([["bad", "{broken"]]);
  await assert.rejects(archiveDamagedValues({...storage, setItem: async () => {throw new Error("Disk full");}}, ["bad"]));
  assert.equal(data.get("bad"), "{broken");
});
test("one damaged journal day does not block healthy days and is excluded from assessments", async () => {
  const goodKey = JOURNAL_PREFIX + "2026-10-19";
  const badKey = JOURNAL_PREFIX + "2026-10-20";
  const {data, storage} = fixture([[goodKey, JSON.stringify({version: 1, entries: {Fajr: entry}})], [badKey, "{broken"], [JOURNAL_STARTED_ON_KEY, "broken"]]);
  const repository = createPrayerJournalRepository(storage);
  const state = await repository.open("2026-10-21");
  assert.equal(state.days["2026-10-19"].Fajr?.completedAt, entry.completedAt);
  assert.deepEqual(state.damagedDates, ["2026-10-20"]);
  assert.equal(state.startDamaged, true);
  assert.equal(state.startedOn, "2026-10-19");
  assert.equal(getJournalPeriodSummary(state.days, "2026-10-19", "week", "2026-10-21", state.startedOn).dayCount, 1);
  assert.equal(getJournalDayStatus(state.days, "2026-10-20", "Fajr", new Date(), new Date(), "2026-10-21", state.startedOn), "unavailable");
  assert.equal(getJournalReflection(state.days, "2026-10-21"), null);
  await assert.rejects(repository.set("2026-10-20", "Fajr", entry));
  assert.equal(data.get(badKey), "{broken");
  assert.equal(await repository.recover(), 2);
  assert.equal((await repository.open("2026-10-21")).startedOn, "2026-10-19");
  assert.ok([...data.values()].includes("{broken"));
  assert.equal((await repository.load())["2026-10-19"].Fajr?.completedAt, entry.completedAt);
});
test("malformed preferences block restore and writes rather than silently replacing them", async t => {
  t.mock.method(AsyncStorage, "multiGet", async (keys: string[]) => keys.map(key => [key, key.endsWith(":settings") ? "{broken" : null]));
  t.mock.method(AsyncStorage, "getItem", async () => "{broken");
  let writes = 0;
  t.mock.method(AsyncStorage, "setItem", async () => {writes++;});
  await assert.rejects(loadPersistedState(), DamagedSavedDataError);
  await assert.rejects(saveSettings(DEFAULT_SETTINGS), DamagedSavedDataError);
  assert.equal(writes, 0);
});
test("an old queued counter save cannot overwrite an import", async t => {
  t.mock.method(AsyncStorage, "getItem", async () => null);
  let writes = 0;
  t.mock.method(AsyncStorage, "setItem", async () => {writes++;});
  let finish!: () => void;
  const gate = new Promise<void>(resolve => {finish = resolve;});
  const lock = withSavedStorageLock(async () => {await gate; notifyRecordsChanged();});
  const stale = saveTasbeehState({selectedId: "general", custom: [], counts: {general: 1}});
  finish(); await lock; await stale;
  assert.equal(writes, 0);
});
