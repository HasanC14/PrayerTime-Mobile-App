import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRAYER_NAMES, type PrayerName } from "../types";

export interface PrayerJournalEntry { completedAt: number; timeZone: string; }
export type PrayerJournalDay = Partial<Record<PrayerName, PrayerJournalEntry>> & {exempt?: boolean};
export type PrayerJournalDays = Record<string, PrayerJournalDay>;
export const JOURNAL_PREFIX = "@PrayerTime:v2:prayerJournal:";
export const JOURNAL_STARTED_ON_KEY = "@PrayerTime:v2:prayerJournalStartedOn";

export function isJournalDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}

export function journalCount(day: PrayerJournalDay | undefined): number {
  return day?.exempt ? 0 : PRAYER_NAMES.filter(prayer => Boolean(day?.[prayer])).length;
}

export function journalWeek(dateKey: string): string[] {
  const date = new Date(`${dateKey}T12:00:00Z`);
  const offset = (date.getUTCDay() + 6) % 7;
  return Array.from({length: 7}, (_, index) => new Date(date.getTime() + (index - offset) * 86400000).toISOString().slice(0, 10));
}

export function canRecordPrayer(start: Date | undefined, now: Date, recorded: boolean): boolean {
  return recorded || Boolean(start && Number.isFinite(start.getTime()) && start <= now);
}

function readDay(value: string | null): PrayerJournalDay {
  if (value === null) return {};
  const data = JSON.parse(value);
  if (!data || data.version !== 1 || !data.entries || typeof data.entries !== "object" || Array.isArray(data.entries)) throw new Error("Invalid prayer journal");
  if (data.exempt !== undefined && typeof data.exempt !== "boolean") throw new Error("Invalid journal exemption");
  const result: PrayerJournalDay = data.exempt ? {exempt: true} : {};
  for (const [name, raw] of Object.entries(data.entries)) {
    const entry = raw as PrayerJournalEntry;
    if (!PRAYER_NAMES.includes(name as PrayerName) || !entry || !Number.isFinite(entry.completedAt) || entry.completedAt <= 0 || typeof entry.timeZone !== "string" || !entry.timeZone.trim() || entry.timeZone.length > 100) throw new Error("Invalid prayer journal entry");
    result[name as PrayerName] = { completedAt: entry.completedAt, timeZone: entry.timeZone };
  }
  return result;
}

function serializeDay(day: PrayerJournalDay): string {
  const {exempt, ...entries} = day;
  return JSON.stringify({version: 1, entries, ...(exempt ? {exempt: true} : {})});
}

interface JournalStorage {
  getAllKeys: () => Promise<readonly string[]>;
  multiGet: (keys: string[]) => Promise<readonly (readonly [string, string | null])[]>;
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
}

// One small atomic value per day avoids a growing history blob. Serial writes
// read the persisted day before merging, so independent prayer updates survive.
export function createPrayerJournalRepository(storage: JournalStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  function enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = queue.then(work, work);
    queue = result.catch(() => undefined);
    return result;
  }
  async function readDays(): Promise<PrayerJournalDays> {
    const keys = (await storage.getAllKeys()).filter(key => key.startsWith(JOURNAL_PREFIX) && isJournalDateKey(key.slice(JOURNAL_PREFIX.length)));
    const entries = keys.length ? await storage.multiGet(keys) : [];
    return Object.fromEntries(entries.map(([key, value]) => [key.slice(JOURNAL_PREFIX.length), readDay(value)]));
  }
  return {
    load(): Promise<PrayerJournalDays> {
      return enqueue(readDays);
    },
    open(dateKey: string): Promise<{days: PrayerJournalDays; startedOn: string}> {
      return enqueue(async () => {
        if (!isJournalDateKey(dateKey)) throw new Error("Invalid journal start date");
        const days = await readDays();
        const savedStart = await storage.getItem(JOURNAL_STARTED_ON_KEY);
        if (savedStart !== null && !isJournalDateKey(savedStart)) throw new Error("Invalid journal start date");
        const firstEntry = Object.keys(days).filter(key => days[key]?.exempt || journalCount(days[key]) > 0).sort()[0];
        const startedOn = savedStart ?? firstEntry ?? dateKey;
        if (savedStart === null) await storage.setItem(JOURNAL_STARTED_ON_KEY, startedOn);
        return {days, startedOn};
      });
    },
    setExempt(dateKey: string, exempt: boolean): Promise<PrayerJournalDay> {
      return enqueue(async () => {
        if (!isJournalDateKey(dateKey)) throw new Error("Invalid journal date");
        const key = JOURNAL_PREFIX + dateKey;
        const day = readDay(await storage.getItem(key));
        if (exempt) day.exempt = true;
        else delete day.exempt;
        if (day.exempt || journalCount(day)) await storage.setItem(key, serializeDay(day));
        else await storage.removeItem(key);
        return day;
      });
    },
    set(dateKey: string, prayer: PrayerName, entry: PrayerJournalEntry | null): Promise<PrayerJournalDay> {
      return enqueue(async () => {
        if (!isJournalDateKey(dateKey) || !PRAYER_NAMES.includes(prayer)) throw new Error("Invalid prayer journal selection");
        const key = JOURNAL_PREFIX + dateKey;
        const day = readDay(await storage.getItem(key));
        if (day.exempt) throw new Error("Remove the day exemption before recording prayers");
        if (entry) day[prayer] = readDay(JSON.stringify({version: 1, entries: {[prayer]: entry}}))[prayer];
        else delete day[prayer];
        if (day.exempt || journalCount(day)) await storage.setItem(key, serializeDay(day));
        else await storage.removeItem(key);
        return day;
      });
    },
  };
}

export const prayerJournalRepository = createPrayerJournalRepository(AsyncStorage);
