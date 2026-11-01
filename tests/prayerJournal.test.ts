import assert from "node:assert/strict";
import test from "node:test";
import { canRecordPrayer, createPrayerJournalRepository, isJournalDateKey, journalCount, journalWeek, JOURNAL_PREFIX, JOURNAL_STARTED_ON_KEY } from "../src/services/prayerJournal";
import { validateSettings } from "../src/services/storage";

const entry = {completedAt: Date.parse("2026-10-24T10:00:00Z"), timeZone: "Asia/Dhaka"};
function fixture() {
  const data = new Map<string, string>();
  const storage = {
    getAllKeys: async () => [...data.keys()],
    multiGet: async (keys: string[]) => keys.map(key => [key, data.get(key) ?? null] as const),
    getItem: async (key: string) => data.get(key) ?? null,
    setItem: async (key: string, value: string) => { data.set(key, value); },
    removeItem: async (key: string) => { data.delete(key); },
  };
  return {data, storage, repository: createPrayerJournalRepository(storage)};
}

test("tracking is opt-in and only accepts a persisted boolean", () => {
  for (const value of [{}, {prayerTrackingEnabled: false}, {prayerTrackingEnabled: "true"}]) assert.equal(validateSettings(value).prayerTrackingEnabled, false);
  assert.equal(validateSettings({prayerTrackingEnabled: true}).prayerTrackingEnabled, true);
});

test("recording and undoing a prayer persists across repository restarts", async () => {
  const {repository, storage, data} = fixture();
  assert.deepEqual(await repository.load(), {});
  await repository.set("2026-10-24", "Dhuhr", entry);
  const restarted = createPrayerJournalRepository(storage);
  assert.deepEqual((await restarted.load())["2026-10-24"], {Dhuhr: entry});
  await restarted.set("2026-10-24", "Dhuhr", null);
  assert.equal(data.size, 0);
});

test("concurrent independent updates merge without losing earlier prayers or other days", async () => {
  const {repository} = fixture();
  await Promise.all([repository.set("2026-10-24", "Fajr", entry), repository.set("2026-10-24", "Dhuhr", entry), repository.set("2026-10-23", "Isha", entry)]);
  await repository.set("2026-10-24", "Fajr", null);
  const days = await repository.load();
  assert.deepEqual(days["2026-10-24"], {Dhuhr: entry});
  assert.deepEqual(days["2026-10-23"], {Isha: entry});
});

test("all five prayers count once, and non-prayer entries cannot be written", async () => {
  const {repository} = fixture();
  for (const prayer of ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const) await repository.set("2026-10-24", prayer, entry);
  await repository.set("2026-10-24", "Fajr", entry);
  assert.equal(journalCount((await repository.load())["2026-10-24"]), 5);
  assert.equal(journalCount(undefined), 0);
  await assert.rejects(repository.set("2026-10-24", "Sunrise" as "Fajr", entry));
});

test("unrelated app storage is ignored and no timezone or settings change re-dates a record", async () => {
  const {repository, data} = fixture();
  data.set("@PrayerTime:v2:settings", "unrelated");
  await repository.set("2026-10-23", "Isha", entry);
  await repository.set("2026-10-24", "Fajr", {...entry, timeZone: "Europe/London"});
  const days = await repository.load();
  assert.equal(days["2026-10-23"].Isha?.timeZone, "Asia/Dhaka");
  assert.equal(days["2026-10-24"].Fajr?.timeZone, "Europe/London");
  assert.equal(data.get("@PrayerTime:v2:settings"), "unrelated");
});

test("invalid history is reported and cannot be overwritten by a toggle", async () => {
  for (const value of ['{broken', '{"version":2,"entries":{}}', '{"version":1,"entries":{"Fajr":{"completedAt":null,"timeZone":"UTC"}}}']) {
    const {repository, data} = fixture();
    data.set(JOURNAL_PREFIX + "2026-10-24", value);
    await assert.rejects(repository.load());
    await assert.rejects(repository.set("2026-10-24", "Fajr", entry));
    assert.equal(data.get(JOURNAL_PREFIX + "2026-10-24"), value);
  }
});

test("a failed storage write leaves confirmed history intact and a retry can succeed", async () => {
  const {storage, data} = fixture();
  let fail = true;
  const repository = createPrayerJournalRepository({...storage, setItem: async (key, value) => {if (fail) throw new Error("Disk full");await storage.setItem(key, value);}});
  await assert.rejects(repository.set("2026-10-24", "Fajr", entry));
  assert.equal(data.size, 0);
  fail = false;
  await repository.set("2026-10-24", "Fajr", entry);
  assert.equal(journalCount((await repository.load())["2026-10-24"]), 1);
});

test("date keys validate leap days and weeks cross months and years without local DST offsets", () => {
  assert.equal(isJournalDateKey("2028-02-29"), true);
  for (const value of ["2026-02-29", "2026-10-32", "2026-13-01", "2026-1-01", "not-a-date"]) assert.equal(isJournalDateKey(value), false);
  assert.deepEqual(journalWeek("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
});

test("future prayers stay disabled, exact starts become available, and existing entries can always be undone", () => {
  const now = new Date("2026-10-24T10:00:00Z");
  assert.equal(canRecordPrayer(new Date(now.getTime() + 1), now, false), false);
  assert.equal(canRecordPrayer(now, now, false), true);
  assert.equal(canRecordPrayer(new Date(now.getTime() - 1), now, false), true);
  assert.equal(canRecordPrayer(undefined, now, false), false);
  assert.equal(canRecordPrayer(undefined, now, true), true);
});

test("tracking start survives an empty journal, undoing every entry, and reopening later", async () => {
  const {repository, storage, data} = fixture();
  assert.deepEqual(await repository.open("2026-10-24"), {days: {}, startedOn: "2026-10-24"});
  await repository.set("2026-10-24", "Fajr", entry);
  await repository.set("2026-10-24", "Fajr", null);
  assert.equal(data.get(JOURNAL_STARTED_ON_KEY), "2026-10-24");
  assert.deepEqual(await createPrayerJournalRepository(storage).open("2026-10-27"), {days: {}, startedOn: "2026-10-24"});
});

test("legacy journal start migrates from its earliest actual entry without changing existing records", async () => {
  const {repository, data} = fixture();
  await repository.set("2026-10-17", "Dhuhr", entry);
  await repository.set("2026-10-23", "Isha", entry);
  data.set(JOURNAL_PREFIX + "2026-10-01", JSON.stringify({version: 1, entries: {}}));
  const original = data.get(JOURNAL_PREFIX + "2026-10-17");
  const state = await repository.open("2026-10-24");
  assert.equal(state.startedOn, "2026-10-17");
  assert.equal(data.get(JOURNAL_PREFIX + "2026-10-17"), original);
});

test("invalid start metadata and failed initialization cannot silently reset tracking history", async () => {
  const {repository, storage, data} = fixture();
  data.set(JOURNAL_STARTED_ON_KEY, "broken");
  await assert.rejects(repository.open("2026-10-24"));
  assert.equal(data.get(JOURNAL_STARTED_ON_KEY), "broken");
  data.delete(JOURNAL_STARTED_ON_KEY);
  const unavailable = createPrayerJournalRepository({...storage, setItem: async () => {throw new Error("Disk full");}});
  await assert.rejects(unavailable.open("2026-10-24"));
  assert.equal(data.has(JOURNAL_STARTED_ON_KEY), false);
  assert.equal((await repository.open("2026-10-24")).startedOn, "2026-10-24");
});

test("exempt days persist without erasing prayers, reject prayer edits, and can be undone", async () => {
  const {repository, storage, data} = fixture();
  await repository.set("2026-10-24", "Fajr", entry);
  const exempt = await repository.setExempt("2026-10-24", true);
  assert.equal(journalCount(exempt), 0);
  assert.equal(exempt.Fajr?.completedAt, entry.completedAt);
  const restarted = createPrayerJournalRepository(storage);
  assert.equal((await restarted.load())["2026-10-24"].exempt, true);
  await assert.rejects(restarted.set("2026-10-24", "Dhuhr", entry));
  const restored = await restarted.setExempt("2026-10-24", false);
  assert.deepEqual(restored, {Fajr: entry});
  assert.equal(journalCount(restored), 1);
  await restarted.setExempt("2026-10-23", true);
  assert.equal((await restarted.open("2026-10-25")).startedOn, "2026-10-23");
  await restarted.setExempt("2026-10-23", false);
  assert.equal(data.has(JOURNAL_PREFIX + "2026-10-23"), false);
  await assert.rejects(restarted.setExempt("2026-02-30", true));
});

test("an exemption storage failure preserves previous entries", async () => {
  const {repository, storage} = fixture();
  await repository.set("2026-10-24", "Fajr", entry);
  const failing = createPrayerJournalRepository({...storage, setItem: async () => {throw new Error("Disk full");}});
  await assert.rejects(failing.setExempt("2026-10-24", true));
  assert.deepEqual((await repository.load())["2026-10-24"], {Fajr: entry});
});
