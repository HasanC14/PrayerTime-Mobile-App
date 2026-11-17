import { locales, localizeDigits, translateMessage } from "../i18n/translate";
import { PRAYER_NAMES, type AppLanguage, type AppLocation, type AppSettings, type HeroArtworkId, type PrayerDay, type PrayerName } from "../types";
import { formatPrayerTime, formatPrayerTimeRange, formatShortDate, getCurrentPrayerGuidance, getPrayerGuidanceWindows, getPrayerState } from "../utils/time";
import { addDaysToDateKey, getDateKeyInTimeZone } from "./prayerTimes";
import { getPrayerFocus, getPrayerPeriods } from "./prayerPeriods";
import { getWidgetAppearance } from "../constants/appearance";

export const WIDGET_CALENDAR_DAYS = 14;
export type HomeWidgetKind = "hero" | "next" | "summary" | "times";
export const HOME_WIDGET_OPTIONS = [
  { id: "hero", title: "Prayer card", description: "Your app's hero card, with artwork and a prayer countdown.", size: "Wide" },
  { id: "next", title: "Next prayer", description: "The next prayer and its start time.", size: "Small" },
  { id: "summary", title: "Day summary", description: "Current prayer, Hijri date, sunrise and sunset. Fasting times appear when enabled.", size: "Wide" },
  { id: "times", title: "Prayer times", description: "All five prayer start times for your day.", size: "Large" }
] as const;

export interface PrayerWidgetProps {
  label: string;
  prayer: string;
  time: string;
  date: string;
  location: string;
  theme: AppSettings["themeMode"];
  isRTL: boolean;
  language?: AppLanguage;
  textScale: number;
  empty: boolean;
  artwork: HeroArtworkId;
  artworkUri?: string;
  appearance?: ReturnType<typeof getWidgetAppearance>;
  hero?: {
    prayer: string; focusPrayer: PrayerName | "Salatud Doha"; phase: "starts" | "ends";
    phaseLabel: string; targetLabel: string; start: number; target: number; targetTime: string;
    windowRange?: string;
    footerLabel: string; footerTime: string; nextPrayer: PrayerName | null; nextTimestamp: number | null;
    danger: boolean;
  };
  summary?: {
    label: string; prayer: string; range: string; date: string; hijri: string;
    sunrise: string; sunset: string; sehri: string; iftar: string;
    sunriseLabel: string; sunsetLabel: string; sehriLabel: string; iftarLabel: string;
    timesLabel: string;
    rows: { name: string; time: string; startTime?: string; active: boolean }[];
  };
}

export interface PrayerWidgetEntry {
  timestamp: number;
  props: PrayerWidgetProps;
}

// The final entry replaces expired times with an explicit refresh prompt.
// No countdown or per-minute JS/background service is needed.
export function buildWidgetTimeline(
  calendar: PrayerDay[], location: AppLocation | null, settings: AppSettings, now = new Date()
): PrayerWidgetEntry[] {
  const t = (message: string) => translateMessage(message, settings.language);
  const base = {
    label: t("Next prayer"), location: location ? t(location.name) : "PrayerTime",
    theme: settings.themeMode, appearance: getWidgetAppearance(settings.themeMode), isRTL: settings.language === "ar", language: settings.language, textScale: settings.textScale, artwork: settings.heroArtwork
  };
  const empty: PrayerWidgetProps = {
    ...base, label: "PrayerTime", prayer: t(location ? "Refresh prayer times" : "Choose your location"),
    time: "", date: t("Open PrayerTime"), empty: true
  };
  const start = now.getTime();
  if (!Number.isFinite(start)) throw new Error("Invalid widget reference time.");
  if (!location) return [{ timestamp: start, props: empty }];
  const endKey = addDaysToDateKey(getDateKeyInTimeZone(now, location.timeZone), WIDGET_CALENDAR_DAYS);
  const events = calendar.filter(day => day.dateKey < endKey)
    .flatMap(day => PRAYER_NAMES.map(name => ({ name, date: day.instants[name] })))
    .filter(event => Number.isFinite(event.date.getTime()) && event.date.getTime() > start)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const unique = events.filter((event, index) => index === 0 || event.date.getTime() !== events[index - 1].date.getTime());
  if (!unique.length) return [{ timestamp: start, props: empty }];
  const timeline = unique.map((event, index) => ({
    timestamp: index === 0 ? start : unique[index - 1].date.getTime(),
    props: {
      ...base, prayer: t(event.name),
      time: formatPrayerTime(event.date, settings.timeFormat, location.timeZone, settings.language),
      date: formatShortDate(event.date, location.timeZone, settings.language), empty: false
    }
  }));
  return [...timeline, { timestamp: unique[unique.length - 1].date.getTime(), props: empty }];
}

export function selectWidgetEntry(entries: PrayerWidgetEntry[], now: number): PrayerWidgetProps | null {
  return [...entries].reverse().find(entry => entry.timestamp <= now)?.props ?? null;
}

// All styles share one offline schedule. Midnight and sunrise entries also keep
// the day summary and active period correct while the app is closed.
export function buildHomeWidgetTimeline(calendar: PrayerDay[], location: AppLocation | null, settings: AppSettings, now = new Date()): PrayerWidgetEntry[] {
  const base = buildWidgetTimeline(calendar, location, settings, now);
  if (!location || base[0].props.empty) return base;
  const t = (text: string) => translateMessage(text, settings.language);
  const format = (date: Date) => formatPrayerTime(date, settings.timeFormat, location.timeZone, settings.language);
  const periods = getPrayerPeriods(calendar);
  const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: location.timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const dateKey = (timestamp: number) => {
    const parts = dateFormatter.formatToParts(new Date(timestamp));
    return `${parts.find(part => part.type === "year")!.value}-${parts.find(part => part.type === "month")!.value}-${parts.find(part => part.type === "day")!.value}`;
  };
  const daily = new Map<string, Omit<NonNullable<PrayerWidgetProps["summary"]>, "label" | "prayer" | "range">>();
  const end = base[base.length - 1].timestamp;
  const dates = new Set(base.map(entry => entry.timestamp));
  for (const day of calendar) {
    // Find local midnight using an Intl-guided binary search, including DST.
    let low = day.instants.Dhuhr.getTime() - 36 * 3600000;
    let high = day.instants.Dhuhr.getTime();
    while (high - low > 1) {
      const middle = Math.floor((low + high) / 2);
      if (dateKey(middle) < day.dateKey) low = middle;
      else high = middle;
    }
    for (const timestamp of [high, day.instants.Sunrise.getTime(), ...getPrayerGuidanceWindows(day).flatMap(window => [window.start.getTime(), window.end.getTime()])]) {
      if (timestamp > now.getTime() && timestamp < end) dates.add(timestamp);
    }
  }
  return [...dates].sort((a, b) => a - b).map(timestamp => {
    const props = selectWidgetEntry(base, timestamp)!;
    if (props.empty) return { timestamp, props };
    const instant = new Date(timestamp);
    const day = calendar.find(item => item.dateKey === dateKey(timestamp));
    if (!day) return { timestamp, props };
    const active = periods.find(period => period.start.getTime() <= timestamp && timestamp < period.end.getTime());
    const focus = getPrayerFocus(instant, calendar);
    const guidance = getCurrentPrayerGuidance(instant, day);
    const next = getPrayerState(instant, calendar).next;
    const heroTarget = guidance?.end ?? focus?.target;
    const heroPhase = guidance ? "ends" : focus?.phase ?? "starts";
    const showNext = next && (guidance || next.name !== focus?.prayer);
    const hero: PrayerWidgetProps["hero"] = focus && heroTarget ? {
      prayer: t(guidance ? "Prohibited time" : focus.prayer), focusPrayer: focus.prayer,
      phase: heroPhase, phaseLabel: t(heroPhase === "ends" ? "ends in" : "starts in"),
      targetLabel: t(heroPhase === "ends" ? "Ends at" : "Starts at"),
      start: (guidance?.start ?? focus.windowStart).getTime(), target: heroTarget.getTime(), targetTime: format(heroTarget),
      windowRange: heroPhase === "ends" ? formatPrayerTimeRange(guidance?.start ?? focus.windowStart, heroTarget, settings.timeFormat, location.timeZone, settings.language) : undefined,
      footerLabel: showNext ? translateMessage("Next · {prayer}", settings.language, { prayer: next.name }) : t(heroPhase === "ends" ? "Ends at" : "Starts at"),
      footerTime: format(showNext ? next.date : heroTarget), nextPrayer: next?.name ?? null, nextTimestamp: next?.date.getTime() ?? null,
      danger: Boolean(guidance)
    } : undefined;
    const range = active ? formatPrayerTimeRange(active.start, active.end, settings.timeFormat, location.timeZone, settings.language) : props.time;
    let details = daily.get(day.dateKey);
    if (!details) {
      const fasting = settings.ramadanMode === "always" || (settings.ramadanMode === "auto" && day.hijriDate.isRamadan);
      let hijri = `${day.hijriDate.day} ${t(day.hijriDate.month)} ${day.hijriDate.year}`;
      try {
        hijri = new Intl.DateTimeFormat(`${locales[settings.language].split('-u-')[0]}-u-ca-islamic-civil`, {
          timeZone: location.timeZone, day: "numeric", month: "long", year: "numeric"
        }).format(new Date(day.instants.Dhuhr.getTime() + (settings.hijriAdjustmentDays || 0) * 86400000));
      } catch { /* Use the app's calculated Hijri date when this calendar is unavailable. */ }
      details = {
        date: formatShortDate(instant, location.timeZone, settings.language), hijri: localizeDigits(hijri, settings.language),
        sunrise: format(day.instants.Sunrise), sunset: format(day.instants.Maghrib),
        sehri: fasting ? format(day.instants.Fajr) : "", iftar: fasting ? format(day.instants.Maghrib) : "",
        sunriseLabel: t("Sunrise"), sunsetLabel: t("Sunset"), sehriLabel: t("Sehri ends"), iftarLabel: t("Iftar"), timesLabel: t("Prayer times"),
        rows: PRAYER_NAMES.map(name => {
          const period = periods.find(item => item.dateKey === day.dateKey && item.prayer === name);
          return { name: t(name), startTime: format(day.instants[name]), time: period ? formatPrayerTimeRange(period.start, period.end, settings.timeFormat, location.timeZone, settings.language) : format(day.instants[name]),
            active: false };
        })
      };
      daily.set(day.dateKey, details);
    }
    return { timestamp, props: { ...props, hero, summary: {
      ...details, label: t(active ? "Current prayer" : "Next prayer"), prayer: active ? t(active.prayer) : props.prayer, range,
      rows: details.rows.map((row, index) => ({ ...row, active: active?.dateKey === day.dateKey && active.prayer === PRAYER_NAMES[index] }))
    } } };
  });
}
