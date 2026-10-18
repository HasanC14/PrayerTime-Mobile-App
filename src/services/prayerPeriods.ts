import type { PrayerAlarmSettings, PrayerDay, PrayerName } from "../types";
import { getSalatudDohaWindow } from "../utils/time";

export interface PrayerPeriod {
  prayer: PrayerName;
  dateKey: string;
  start: Date;
  end: Date;
}

export interface PrayerFocus {
  prayer: PrayerName | "Salatud Doha";
  phase: "ends" | "starts";
  windowStart: Date;
  target: Date;
  progress: number;
  startLabel: string;
}

export interface PrayerAlarmOccurrence {
  prayer: PrayerName;
  dateKey: string;
  trigger: Date;
  periodEnd: Date;
  minutesBeforeEnd: number;
}

function progressBetween(start: Date, end: Date, now: Date): number {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / duration) * 100));
}

export function getPrayerPeriods(calendar: PrayerDay[]): PrayerPeriod[] {
  const days = [...calendar].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  const periods: PrayerPeriod[] = [];

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    const nextDay = days[index + 1];
    const candidates: [PrayerName, Date, Date | undefined][] = [
      ["Fajr", day.instants.Fajr, day.instants.Sunrise],
      ["Dhuhr", day.instants.Dhuhr, day.instants.Asr],
      ["Asr", day.instants.Asr, day.instants.Maghrib],
      ["Maghrib", day.instants.Maghrib, day.instants.Isha],
      ["Isha", day.instants.Isha, nextDay?.instants.Fajr]
    ];

    for (const [prayer, start, end] of candidates) {
      if (!end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) continue;
      periods.push({ prayer, dateKey: day.dateKey, start, end });
    }
  }

  return periods.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getPrayerFocus(now: Date, calendar: PrayerDay[]): PrayerFocus | null {
  const periods = getPrayerPeriods(calendar);
  const active = periods.find((period) => period.start <= now && now < period.end);
  if (active) {
    return {
      prayer: active.prayer,
      phase: "ends",
      windowStart: active.start,
      target: active.end,
      progress: progressBetween(active.start, active.end, now),
      startLabel: active.prayer
    };
  }

  const salatudDoha = calendar
    .map(getSalatudDohaWindow)
    .find((window) => window.start <= now && now < window.end);
  if (salatudDoha) {
    return {
      prayer: "Salatud Doha",
      phase: "ends",
      windowStart: salatudDoha.start,
      target: salatudDoha.end,
      progress: progressBetween(salatudDoha.start, salatudDoha.end, now),
      startLabel: "Salatud Doha"
    };
  }

  const next = periods.find((period) => period.start > now);
  if (!next) return null;
  const previous = [...periods].reverse().find((period) => period.end <= now);
  const windowStart = previous?.end ?? now;

  return {
    prayer: next.prayer,
    phase: "starts",
    windowStart,
    target: next.start,
    progress: progressBetween(windowStart, next.start, now),
    startLabel: previous?.prayer === "Fajr" ? "Sunrise" : "Now"
  };
}

export function getPrayerPeriodsForDate(calendar: PrayerDay[], dateKey: string): Map<PrayerName, PrayerPeriod> {
  return new Map(getPrayerPeriods(calendar)
    .filter((period) => period.dateKey === dateKey)
    .map((period) => [period.prayer, period]));
}

export function getPrayerAlarmOccurrences(
  calendar: PrayerDay[],
  alarms: PrayerAlarmSettings,
  now = new Date(),
  horizonDays = 7
): PrayerAlarmOccurrence[] {
  const occurrences = getPrayerPeriods(calendar)
    .flatMap((period) => {
      const minutesBeforeEnd = alarms[period.prayer];
      if (minutesBeforeEnd === null) return [];
      const trigger = new Date(period.end.getTime() - minutesBeforeEnd * 60_000);
      if (trigger <= now || trigger < period.start || trigger >= period.end) return [];
      return [{ prayer: period.prayer, dateKey: period.dateKey, trigger, periodEnd: period.end, minutesBeforeEnd }];
    })
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime());

  const includedDateKeys = new Set<string>();
  for (const occurrence of occurrences) {
    if (includedDateKeys.has(occurrence.dateKey)) continue;
    if (includedDateKeys.size >= horizonDays) break;
    includedDateKeys.add(occurrence.dateKey);
  }
  return occurrences.filter((occurrence) => includedDateKeys.has(occurrence.dateKey));
}
