import assert from "node:assert/strict";
import test from "node:test";
import {exportRecordBackup, importRecordBackup, parseRecordBackup, MAX_BACKUP_BYTES, RecordImportWriteError} from "../src/services/recordBackup";
import {JOURNAL_PREFIX, JOURNAL_STARTED_ON_KEY, readJournalDay} from "../src/services/prayerJournal";

const counter = "@PrayerTime:v2:tasbeeh";
const day = JOURNAL_PREFIX + "2026-10-24";
const entry = {completedAt: 1792836000000, timeZone: "Asia/Dhaka"};
const journal = (entries: object, exempt = false) => JSON.stringify({version: 1, entries, ...(exempt ? {exempt: true} : {})});
const backup = (entries: object) => JSON.stringify({format: "PrayerTime records", version: 1, exportedAt: "2026-11-06", entries});
function fixture(initial: [string, string][] = []) {
  const data = new Map(initial);
  const storage = {
    getAllKeys: async () => [...data.keys()],
    multiGet: async (keys: string[]) => keys.map(key => [key, data.get(key) ?? null] as const),
    setItem: async (key: string, raw: string) => {data.set(key, raw);},
  };
  return {data, storage};
}
test("export excludes settings, location, schedules and their recovery archives", async () => {
  const {storage} = fixture([
    [day, journal({Fajr: entry})], [counter, JSON.stringify({custom: [], counts: {general: 9}})],
    ["@PrayerTime:v2:location", "private-location"], ["@PrayerTime:v2:settings", "private-settings"],
    ["@PrayerTime:v2:notificationIds", "private-schedules"],
    ["@PrayerTime:v2:recovery:10:" + encodeURIComponent("@PrayerTime:v2:location"), "private-archived-location"],
    ["@PrayerTime:v2:recovery:journal:10:key", "original-damaged-record"],
  ]);
  const text = await exportRecordBackup(storage);
  assert.equal(text.includes("private-"), false);
  assert.equal(Object.keys(parseRecordBackup(text).entries).length, 3);
});
test("damaged journal and counter bytes export as archives and never restore as live state", async () => {
  const source = fixture([[day, "{broken"], [counter, "null"]]);
  const text = await exportRecordBackup(source.storage);
  const parsed = parseRecordBackup(text);
  assert.equal(parsed.entries[day], undefined);
  const target = fixture();
  await importRecordBackup(target.storage, text);
  assert.equal(target.data.has(day), false);
  assert.equal(target.data.has(counter), false);
  assert.ok([...target.data.values()].includes("{broken"));
  assert.ok((await exportRecordBackup(target.storage)).includes("{broken"));
});
test("imports merge missing prayers, preserve confirmed entries and an existing exemption", async () => {
  const {data, storage} = fixture([[day, journal({Fajr: entry}, true)], [JOURNAL_STARTED_ON_KEY, "2026-10-24"]]);
  await importRecordBackup(storage, backup({[day]: journal({Fajr: {...entry, completedAt: entry.completedAt + 100}, Dhuhr: entry}), [JOURNAL_STARTED_ON_KEY]: "2026-10-01"}));
  assert.deepEqual(readJournalDay(data.get(day)!), {exempt: true, Fajr: entry, Dhuhr: entry});
  assert.equal(data.get(JOURNAL_STARTED_ON_KEY), "2026-10-01");
  assert.ok([...data.keys()].some(key => key.includes("before-import")));
});
test("incoming exemption cannot hide prayers already recorded on this device", async () => {
  const {data, storage} = fixture([[day, journal({Fajr: entry})]]);
  await importRecordBackup(storage, backup({[day]: journal({}, true)}));
  assert.deepEqual(readJournalDay(data.get(day)!), {Fajr: entry});
});
test("counter imports use higher totals, retain custom counters and the current selection", async () => {
  const custom = {id: "custom-reading", name: "Reading", target: 10};
  const {data, storage} = fixture([[counter, JSON.stringify({selectedId: "general", custom: [], counts: {general: 8, subhanallah: 9}})]]);
  await importRecordBackup(storage, backup({[counter]: JSON.stringify({selectedId: custom.id, custom: [custom], counts: {general: 3, subhanallah: 12, [custom.id]: 2}})}));
  assert.deepEqual(JSON.parse(data.get(counter)!), {selectedId: "general", custom: [custom], counts: {general: 8, subhanallah: 12, [custom.id]: 2}});
});
test("invalid, unsupported and oversized backups fail before any write", async () => {
  const {data, storage} = fixture();
  for (const raw of ["{bad", backup({[day]: "{bad"}), backup({[counter]: "null"}), backup({"@PrayerTime:v2:location": "{}"}), " ".repeat(MAX_BACKUP_BYTES + 1), JSON.stringify({format: "PrayerTime records", version: 2, entries: {}})]) {
    await assert.rejects(importRecordBackup(storage, raw));
    assert.equal(data.size, 0);
  }
});
test("unreadable existing data and archive failures cannot be overwritten by import", async () => {
  const damaged = fixture([[counter, "null"]]);
  await assert.rejects(importRecordBackup(damaged.storage, backup({[counter]: JSON.stringify({custom: [], counts: {}})})));
  assert.equal(damaged.data.get(counter), "null");
  const intact = fixture([[day, journal({Fajr: entry})]]);
  await assert.rejects(importRecordBackup({...intact.storage, setItem: async () => {throw new Error("Disk full");}}, backup({[day]: journal({Dhuhr: entry})})));
  assert.deepEqual(readJournalDay(intact.data.get(day)!), {Fajr: entry});
});

test("an interrupted multi-record merge preserves previous bytes in its recovery snapshot", async () => {
  const nextDay = JOURNAL_PREFIX + "2026-10-25";
  const previous = journal({Fajr: entry});
  const {data, storage} = fixture([[day, previous], [nextDay, previous]]);
  const failing = {...storage, setItem: async (key: string, raw: string) => {
    if (key === nextDay) throw new Error("Disk full");
    await storage.setItem(key, raw);
  }};
  await assert.rejects(importRecordBackup(failing, backup({[day]: journal({Dhuhr: entry}), [nextDay]: journal({Dhuhr: entry})})), RecordImportWriteError);
  assert.deepEqual(readJournalDay(data.get(day)!), {Fajr: entry, Dhuhr: entry});
  assert.equal(data.get(nextDay), previous);
  const snapshot = [...data.entries()].find(([key]) => key.includes("before-import"))!;
  assert.deepEqual(JSON.parse(snapshot[1]).entries, {[day]: previous, [nextDay]: previous});
});
