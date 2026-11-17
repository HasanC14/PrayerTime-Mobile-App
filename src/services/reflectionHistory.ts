import AsyncStorage from "@react-native-async-storage/async-storage";
import { PRAYER_REFLECTIONS, type PrayerReflection, type ReflectionTheme } from "../content/prayerReflections";
import { isJournalDateKey } from "./prayerJournal";

export const REFLECTION_HISTORY_KEY = "@PrayerTime:v2:reflectionHistory";
export interface ReflectionHistory {
  version: 1;
  seen: string[];
  weeks: Record<string, string>;
  lastId: string | null;
}
export interface ReflectionSelection {
  week: string;
  theme: ReflectionTheme;
  allExempt: boolean;
  focusPrayer?: string;
}
const empty = (): ReflectionHistory => ({version: 1, seen: [], weeks: {}, lastId: null});
const byId = new Map(PRAYER_REFLECTIONS.map(item => [item.id, item]));

export function validateReflectionHistory(raw: unknown): ReflectionHistory {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty();
  const value = raw as Partial<ReflectionHistory>;
  if (value.version !== 1) return empty();
  const weeks = value.weeks && typeof value.weeks === "object" && !Array.isArray(value.weeks)
    ? Object.fromEntries(Object.entries(value.weeks).filter(([week, id]) => isJournalDateKey(week) && typeof id === "string" && byId.has(id))
      .sort(([a], [b]) => a.localeCompare(b)).slice(-156)) : {};
  return {version: 1, weeks,
    seen: Array.isArray(value.seen) ? [...new Set(value.seen.filter((id): id is string => typeof id === "string" && byId.has(id)))] : [],
    lastId: typeof value.lastId === "string" && byId.has(value.lastId) ? value.lastId : null};
}

export function chooseReflection(selection: ReflectionSelection, raw: ReflectionHistory) {
  if (!isJournalDateKey(selection.week)) throw new Error("Invalid reflection week");
  const history = validateReflectionHistory(raw);
  const eligible = PRAYER_REFLECTIONS.filter(item => selection.allExempt
    ? item.exemptionSafe === true
    : item.tone !== "warning" || (selection.theme !== "starting" && selection.theme !== "returning"));
  const pinned = eligible.find(item => item.id === history.weeks[selection.week]);
  if (pinned) return {reflection: pinned, history};

  const seen = new Set(history.seen);
  let unseen = eligible.filter(item => !seen.has(item.id));
  if (!unseen.length) {
    // Recycle only the exhausted eligible pool. Other topics retain their history.
    for (const item of eligible) seen.delete(item.id);
    unseen = eligible;
  }
  if (unseen.length > 1) unseen = unseen.filter(item => item.id !== history.lastId);
  const score = (item: PrayerReflection) => (item.themes.includes(selection.theme) ? 1 : 0)
    + (selection.focusPrayer && item.focusPrayer === selection.focusPrayer ? 2 : 0);
  const bestScore = Math.max(...unseen.map(score));
  const best = unseen.filter(item => score(item) === bestScore);
  const weekIndex = Math.floor(Date.parse(`${selection.week}T12:00:00Z`) / (7 * 86400000));
  const reflection = best[((weekIndex % best.length) + best.length) % best.length];
  seen.add(reflection.id);
  return {reflection, history: validateReflectionHistory({version: 1, seen: [...seen],
    weeks: {...history.weeks, [selection.week]: reflection.id}, lastId: reflection.id})};
}

interface ReflectionStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
}
export function createReflectionRepository(storage: ReflectionStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  let sessionHistory: ReflectionHistory | null = null;
  let loadedSuccessfully = false;
  return {
    resolve(selection: ReflectionSelection) {
      const result = queue.then(async () => {
        // If storage cannot be read, keep a stable in-memory choice without
        // overwriting unreadable history. A later visit retries the read.
        let stored: ReflectionHistory;
        let readable = true;
        try {
          const raw = await storage.getItem(REFLECTION_HISTORY_KEY);
          stored = validateReflectionHistory(raw ? JSON.parse(raw) : null);
        } catch {
          readable = false;
          stored = sessionHistory ?? empty();
        }
        // After a successful initial read, the serialized in-memory state is
        // authoritative. Re-merging an old disk cycle after a failed write
        // would restore exhausted IDs and make the next cycle repeat.
        const merged = !sessionHistory ? stored : loadedSuccessfully ? sessionHistory : validateReflectionHistory({version: 1,
          seen: [...stored.seen, ...sessionHistory.seen],
          weeks: {...sessionHistory.weeks, ...stored.weeks},
          lastId: sessionHistory.lastId ?? stored.lastId});
        if (readable) loadedSuccessfully = true;
        const chosen = chooseReflection(selection, merged);
        sessionHistory = chosen.history;
        let saved = false;
        if (readable) {
          try { await storage.setItem(REFLECTION_HISTORY_KEY, JSON.stringify(chosen.history)); saved = true; }
          catch { /* Preserve this session's selection and retry on the next visit. */ }
        }
        return {reflection: chosen.reflection, saved};
      });
      queue = result.catch(() => undefined);
      return result;
    }
  };
}
export const reflectionRepository = createReflectionRepository(AsyncStorage);
