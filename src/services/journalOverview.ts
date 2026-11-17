import type { PrayerDay, PrayerName } from "../types";
import { PRAYER_NAMES } from "../types";
import { getCurrentPrayerPeriod } from "./prayerPeriods";
import { addDaysToDateKey, getDateKeyInTimeZone } from "./prayerTimes";
import type { PrayerJournalDays } from "./prayerJournal";
import { isJournalDateKey, journalCount, journalWeek } from "./prayerJournal";

export type JournalPeriod = "week" | "month";

export function getJournalPeriod(anchor: string, period: JournalPeriod): {start: string; end: string} {
  if (period === "week") {
    const week = journalWeek(anchor);
    return {start: week[0], end: week[6]};
  }
  const start = `${anchor.slice(0, 7)}-01`;
  const end = new Date(`${start}T12:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  return {start, end: end.toISOString().slice(0, 10)};
}

export function moveJournalPeriod(anchor: string, period: JournalPeriod, offset: number): string {
  if (period === "week") return addDaysToDateKey(anchor, offset * 7);
  const date = new Date(`${anchor.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  const target = date.toISOString().slice(0, 10);
  const lastDay = Number(getJournalPeriod(target, "month").end.slice(-2));
  date.setUTCDate(Math.min(Number(anchor.slice(-2)), lastDay));
  return date.toISOString().slice(0, 10);
}

export function getJournalTrackingStart(days: PrayerJournalDays, startedOn: string | null, activeKey: string): string {
  const candidates = Object.keys(days).filter(key => isJournalDateKey(key) && (days[key]?.exempt || journalCount(days[key]) > 0));
  if (startedOn && isJournalDateKey(startedOn)) candidates.push(startedOn);
  return candidates.sort()[0] ?? activeKey;
}

export function getJournalPeriodSummary(days: PrayerJournalDays, anchor: string, period: JournalPeriod, activeKey: string, startedOn: string | null) {
  const {start, end} = getJournalPeriod(anchor, period);
  const trackingStart = getJournalTrackingStart(days, startedOn, activeKey);
  const from = start > trackingStart ? start : trackingStart;
  const yesterday = addDaysToDateKey(activeKey, -1);
  const to = end < yesterday ? end : yesterday;
  const included: string[] = [];
  let exemptDays = 0;
  for (let key = from; key <= to; key = addDaysToDateKey(key, 1)) {
    if (days[key]?.unreadable) continue;
    if (days[key]?.exempt) exemptDays++;
    else included.push(key);
  }
  // No checkmarks in a calendar week means insufficient activity, not 35 misses.
  const activeWeeks = new Set(Object.keys(days).filter(key => key >= trackingStart && key < activeKey && journalCount(days[key]) > 0).map(key => journalWeek(key)[0]));
  const assessed = included.filter(key => activeWeeks.has(journalWeek(key)[0]));
  const prayers = PRAYER_NAMES.map(prayer => {
    const recorded = included.filter(key => days[key]?.[prayer]).length;
    return {prayer, recorded, total: included.length, notRecorded: included.length - recorded,
      missed: assessed.length - recorded, unlogged: included.length - assessed.length,
      progress: included.length ? recorded / included.length * 100 : 0};
  });
  const recorded = prayers.reduce((sum, prayer) => sum + prayer.recorded, 0);
  const total = included.length * PRAYER_NAMES.length;
  return {start, end, trackingStart, firstIncluded: included[0] ?? null, lastIncluded: included.at(-1) ?? null,
    dayCount: included.length, exemptDays, recorded, total, notRecorded: total - recorded,
    missed: assessed.length * PRAYER_NAMES.length - recorded,
    unlogged: (included.length - assessed.length) * PRAYER_NAMES.length, assessedTotal: assessed.length * PRAYER_NAMES.length, prayers};
}

export function getJournalDateKey(now: Date, calendar: PrayerDay[], timeZone: string): string {
  const current = getCurrentPrayerPeriod(now, calendar);
  return current?.prayer === "Isha" ? current.dateKey : getDateKeyInTimeZone(now, timeZone);
}

export type JournalStatus = "recorded" | "not-recorded" | "missed" | "exempt" | "upcoming" | "unavailable";

export function getJournalStatus(recorded: boolean, start: Date | undefined, now: Date): JournalStatus {
  if (recorded) return "recorded";
  if (!start || !Number.isFinite(start.getTime())) return "unavailable";
  return start <= now ? "not-recorded" : "upcoming";
}

export function getJournalDayStatus(days: PrayerJournalDays, dateKey: string, prayer: PrayerName, start: Date | undefined,
  now: Date, activeKey: string, trackingStart: string): JournalStatus {
  if (days[dateKey]?.unreadable) return "unavailable";
  if (days[dateKey]?.exempt) return "exempt";
  if (days[dateKey]?.[prayer]) return "recorded";
  const weekHasEntries = journalWeek(dateKey).some(key => key >= trackingStart && key < activeKey && journalCount(days[key]) > 0);
  if (dateKey >= trackingStart && dateKey < activeKey && weekHasEntries) return "missed";
  return getJournalStatus(false, start, now);
}

// Use completed prayer days only, starting with the first actual entry. A new
// journal must not imply that days before someone began tracking were missed.
export function getJournalReflection(days: PrayerJournalDays, activeDateKey: string): {
  prayer: PrayerName; count: number; days: number;
} | null {
  const firstRecord = Object.keys(days).filter(key => key < activeDateKey && PRAYER_NAMES.some(prayer => days[key]?.[prayer])).sort()[0];
  if (!firstRecord) return null;
  const dates = Array.from({length: 7}, (_, index) => addDaysToDateKey(activeDateKey, index - 7)).filter(key => key >= firstRecord && !days[key]?.exempt && !days[key]?.unreadable);
  if (dates.length < 2) return null;
  const counts = PRAYER_NAMES.map(prayer => ({prayer, count: dates.filter(key => days[key]?.[prayer]).length, days: dates.length}));
  return counts.reduce((lowest, current) => current.count < lowest.count ? current : lowest);
}
