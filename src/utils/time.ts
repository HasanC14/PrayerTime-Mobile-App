import { locales, translateMessage } from "../i18n/translate";
import { PRAYER_NAMES } from "../types";
import type { AppLanguage, PrayerDay, PrayerName, PrayerState, TimeFormat } from "../types";

function localizeTimePeriod(value: string, language: AppLanguage): string {
  return language === "bn" ? value.replace(/AM/g, "পূর্বাহ্ণ").replace(/PM/g, "অপরাহ্ণ") : value;
}

export function formatPrayerTime(date: Date | undefined, format: TimeFormat, timeZone: string, language: AppLanguage = "en"): string {
  if (!date || !Number.isFinite(date.getTime())) return "—";
  return localizeTimePeriod(new Intl.DateTimeFormat(locales[language], {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    ...(format === "12h" ? { hour12: true } : { hourCycle: "h23" })
  }).format(date), language);
}

export function formatPrayerTimeRange(
  start: Date | undefined,
  end: Date | undefined,
  format: TimeFormat,
  timeZone: string,
  language: AppLanguage = "en"
): string {
  if (
    !start ||
    !end ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime())
  ) {
    return "—";
  }

  const formatter = new Intl.DateTimeFormat(locales[language], {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    ...(format === "12h" ? { hour12: true } : { hourCycle: "h23" })
  });
  const normalize = (value: string) => localizeTimePeriod(value.replace(/\s+/g, " ").trim(), language);
  const startText = normalize(formatter.format(start));
  const endText = normalize(formatter.format(end));

  if (format === "24h") return `${startText} – ${endText}`;

  const startParts = formatter.formatToParts(start);
  const endParts = formatter.formatToParts(end);
  const startPeriod = startParts.find((part) => part.type === "dayPeriod")?.value;
  const endPeriod = endParts.find((part) => part.type === "dayPeriod")?.value;
  const compactStart = normalize(
    startParts
      .filter((part) => part.type !== "dayPeriod")
      .map((part) => part.value)
      .join("")
  );

  return startPeriod && startPeriod === endPeriod
    ? `${compactStart} – ${endText}`
    : `${startText} – ${endText}`;
}

export function formatDuration(durationMs: number, language: AppLanguage = "en"): string {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return translateMessage("Now", language);
  const totalMinutes = Math.max(1, Math.floor(durationMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return translateMessage(hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`, language);
}

export function formatLongDate(date: Date, timeZone: string, language: AppLanguage = "en"): string {
  return new Intl.DateTimeFormat(locales[language], {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

export function formatShortDate(date: Date, timeZone: string, language: AppLanguage = "en"): string {
  return new Intl.DateTimeFormat(locales[language], {
    timeZone,
    month: "short",
    day: "numeric"
  }).format(date);
}

export function formatRelativeLocationAge(capturedAt: number): string {
  if (!capturedAt) return "Saved location";
  const ageMinutes = Math.max(0, Math.floor((Date.now() - capturedAt) / 60_000));
  if (ageMinutes < 2) return "Updated just now";
  if (ageMinutes < 60) return `Updated ${ageMinutes}m ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `Updated ${ageHours}h ago`;
  return `Updated ${Math.floor(ageHours / 24)}d ago`;
}

export function getProgressBetween(start: Date, end: Date, currentTime: Date): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, ((currentTime.getTime() - start.getTime()) / total) * 100));
}

export function getPrayerState(currentTime: Date, calendar: PrayerDay[]): PrayerState {
  const occurrences = calendar
    .flatMap((day) =>
      PRAYER_NAMES.map((name) => ({ name, date: day.instants[name] }))
    )
    .filter((item) => Number.isFinite(item.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let previous: { name: PrayerName; date: Date } | null = null;
  let next: { name: PrayerName; date: Date } | null = null;

  for (const occurrence of occurrences) {
    if (occurrence.date <= currentTime) previous = occurrence;
    else {
      next = occurrence;
      break;
    }
  }

  return {
    previous,
    next,
    progress: previous && next ? getProgressBetween(previous.date, next.date, currentTime) : 0
  };
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export interface PrayerGuidanceWindow {
  key: "sunrise" | "solar-noon" | "sunset";
  title: string;
  start: Date;
  end: Date;
  message: string;
}

export interface SalatudDohaWindow {
  start: Date;
  end: Date;
}

const SUNRISE_PROHIBITED_MINUTES = 15;
const SOLAR_NOON_PROHIBITED_MINUTES = 5;

export function getSalatudDohaWindow(day: PrayerDay): SalatudDohaWindow {
  return {
    start: addMinutes(day.instants.Sunrise, SUNRISE_PROHIBITED_MINUTES),
    end: addMinutes(day.instants.Dhuhr, -SOLAR_NOON_PROHIBITED_MINUTES)
  };
}

export function getPrayerGuidanceWindows(day: PrayerDay): PrayerGuidanceWindow[] {
  return [
    {
      key: "sunrise",
      title: "Around sunrise",
      start: day.instants.Sunrise,
      end: addMinutes(day.instants.Sunrise, SUNRISE_PROHIBITED_MINUTES),
      message: "Some voluntary prayers are avoided while the sun is visibly rising. Many communities wait briefly before Duha."
    },
    {
      key: "solar-noon",
      title: "Around solar noon",
      start: addMinutes(day.instants.Dhuhr, -SOLAR_NOON_PROHIBITED_MINUTES),
      end: day.instants.Dhuhr,
      message: "A brief interval around the sun’s zenith may be avoided. Dhuhr begins after this interval has passed."
    },
    {
      key: "sunset",
      title: "Around sunset",
      start: addMinutes(day.instants.Maghrib, -10),
      end: day.instants.Maghrib,
      message: "Some voluntary prayers are avoided while the sun is visibly setting. Maghrib begins after sunset."
    }
  ];
}

export function getCurrentPrayerGuidance(
  currentTime: Date,
  day: PrayerDay | undefined
): PrayerGuidanceWindow | null {
  if (!day) return null;
  const active = getPrayerGuidanceWindows(day).find(
    (window) => currentTime >= window.start && currentTime < window.end
  );
  return active ?? null;
}
