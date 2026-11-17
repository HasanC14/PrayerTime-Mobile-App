import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/constants/settings";
import { calculatePrayerCalendar, calculatePrayerDay } from "../src/services/prayerTimes";
import { buildHomeWidgetTimeline, buildWidgetTimeline, selectWidgetEntry } from "../src/services/widgetTimeline";
import { createWidgetPublisher } from "../src/services/widgetPublisher";
import { getPrayerFocus } from "../src/services/prayerPeriods";
import { getCurrentPrayerGuidance, getPrayerGuidanceWindows } from "../src/utils/time";
import {formatPrayerTime, formatPrayerTimeRange} from "../src/utils/time";
import {PRAYER_NAMES} from "../src/types";
import type { AppLocation } from "../src/types";

const dhaka: AppLocation = { name: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125, countryCode: "BD", timeZone: "Asia/Dhaka", capturedAt: 1, source: "manual" };

test("a delayed widget refresh selects the new period rather than an expired prohibited countdown", () => {
  const now = new Date("2026-11-04T00:00:00Z");
  const calendar = calculatePrayerCalendar(dhaka, DEFAULT_SETTINGS, now, 1, 15);
  const entries = buildHomeWidgetTimeline(calendar, dhaka, {...DEFAULT_SETTINGS, language: "bn"}, now);
  const day = calendar.find(day => day.dateKey === "2026-11-04")!;
  for (const window of getPrayerGuidanceWindows(day)) {
    const late = new Date(window.end.getTime() + 34_000);
    const hero = selectWidgetEntry(entries, late.getTime())!.hero!;
    assert.equal(hero.danger, false);
    assert.ok(hero.target > late.getTime());
    assert.equal(hero.focusPrayer, getPrayerFocus(late, calendar)!.prayer);
    assert.equal(getCurrentPrayerGuidance(late, day), null);
  }
});
const now = new Date("2026-10-23T04:00:00Z");
const calendar = calculatePrayerCalendar(dhaka, DEFAULT_SETTINGS, now, 1, 15);

test("hero widget matches the app's current prayer, deadline, next row and artwork", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  const reference = new Date(day.instants.Asr.getTime() + 1000);
  for (const artwork of ["serenity", "skyline", "moonlit"] as const) {
    const entries = buildHomeWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, heroArtwork: artwork }, reference);
    assert.ok(entries.every(entry => entry.props.artwork === artwork));
    const props = entries[0].props;
    const focus = getPrayerFocus(reference, calendar)!;
    assert.equal(props.hero?.prayer, "Asr");
    assert.equal(props.hero?.target, focus.target.getTime());
    assert.equal(props.hero?.start, focus.windowStart.getTime());
    assert.equal(props.hero?.phaseLabel, "ends in");
    assert.equal(props.hero?.windowRange, formatPrayerTimeRange(focus.windowStart, focus.target, DEFAULT_SETTINGS.timeFormat, dhaka.timeZone, "en"));
    assert.equal(props.hero?.footerLabel, "Next · Maghrib");
    assert.equal(props.hero?.danger, false);
    assert.equal(entries.at(-1)?.props.hero, undefined);
  }
});

test("widget time windows follow the focused interval, locale and time format", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  for (const language of ["en", "bn", "ar"] as const) for (const timeFormat of ["12h", "24h"] as const) {
    const settings = {...DEFAULT_SETTINGS, language, timeFormat};
    const entries = buildHomeWidgetTimeline(calendar, dhaka, settings, new Date(day.instants.Fajr.getTime() - 1000));
    for (const entry of entries.filter(entry => entry.props.hero)) {
      const hero = entry.props.hero!;
      if (hero.phase === "ends") assert.equal(hero.windowRange, formatPrayerTimeRange(new Date(hero.start), new Date(hero.target), timeFormat, dhaka.timeZone, language));
      else {
        assert.equal(hero.windowRange, undefined);
        assert.equal(hero.targetTime, formatPrayerTime(new Date(hero.target), timeFormat, dhaka.timeZone, language));
      }
    }
  }
});

test("hero widget follows the same prohibited-time and Doha transitions as the app", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  const reference = new Date(day.instants.Sunrise.getTime() - 1000);
  const entries = buildHomeWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, reference);
  const sunrise = selectWidgetEntry(entries, day.instants.Sunrise.getTime())!;
  assert.equal(sunrise.hero?.prayer, "Prohibited time");
  assert.equal(sunrise.hero?.danger, true);
  assert.equal(sunrise.hero?.target, day.instants.Sunrise.getTime() + 15 * 60000);
  const doha = selectWidgetEntry(entries, day.instants.Sunrise.getTime() + 15 * 60000)!;
  assert.equal(doha.hero?.focusPrayer, "Salatud Doha");
  assert.equal(doha.hero?.danger, false);
  const noon = selectWidgetEntry(entries, day.instants.Dhuhr.getTime() - 6 * 60000)!;
  assert.equal(noon.hero?.danger, true);
  assert.equal(noon.hero?.target, day.instants.Dhuhr.getTime());
  const dhuhr = selectWidgetEntry(entries, day.instants.Dhuhr.getTime())!;
  assert.equal(dhuhr.hero?.danger, false);
  assert.equal(dhuhr.hero?.focusPrayer, "Dhuhr");
  const sunsetStart = day.instants.Maghrib.getTime() - 15 * 60000;
  assert.equal(selectWidgetEntry(entries, sunsetStart - 1)?.hero?.danger, false);
  const sunset = selectWidgetEntry(entries, sunsetStart)!;
  assert.equal(sunset.hero?.danger, true);
  assert.equal(sunset.hero?.target, day.instants.Maghrib.getTime());
  assert.equal(selectWidgetEntry(entries, day.instants.Maghrib.getTime())?.hero?.danger, false);
});

test("day summary includes the current period, all five ranges and optional fasting times", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  const duringAsr = new Date(day.instants.Asr.getTime() + 1000);
  const props = buildHomeWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, ramadanMode: "always" }, duringAsr)[0].props;
  assert.equal(props.prayer, "Maghrib");
  assert.equal(props.summary?.prayer, "Asr");
  assert.equal(props.summary?.label, "Current prayer");
  assert.equal(props.summary?.rows.length, 5);
  assert.deepEqual(props.summary?.rows.filter(row => row.active).map(row => row.name), ["Asr"]);
  assert.ok(props.summary?.rows.every(row => row.time.includes("–")));
  assert.ok(props.summary?.hijri);
  assert.ok(props.summary?.sehri);
  assert.equal(props.summary?.iftar, props.summary?.sunset);
  const withoutFasting = buildHomeWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, ramadanMode: "off" }, duringAsr)[0].props;
  assert.equal(withoutFasting.summary?.sehri, "");
  assert.equal(withoutFasting.summary?.iftar, "");
});

test("widget tables supply localized starts without losing the full prayer periods", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  for (const language of ["en", "bn", "ar"] as const) for (const timeFormat of ["12h", "24h"] as const) {
    const settings = {...DEFAULT_SETTINGS, language, timeFormat};
    const props = buildHomeWidgetTimeline(calendar, dhaka, settings, new Date(day.instants.Asr.getTime() + 1000))[0].props;
    assert.equal(props.language, language);
    assert.deepEqual(props.summary?.rows.map(row => row.startTime), PRAYER_NAMES.map(name => formatPrayerTime(day.instants[name], timeFormat, dhaka.timeZone, language)));
    assert.ok(props.summary?.rows.every(row => row.time.includes("–") && !row.startTime?.includes("–")));
    assert.equal(props.summary?.rows.filter(row => row.active).length, 1);
  }
});

test("detail widgets update at local midnight, sunrise, and after the schedule expires", () => {
  const day = calendar.find(day => day.dateKey === "2026-10-23")!;
  const entries = buildHomeWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, now);
  const midnight = new Date("2026-10-23T18:00:00Z").getTime();
  assert.ok(entries.some(entry => entry.timestamp === midnight));
  assert.match(selectWidgetEntry(entries, midnight)!.summary!.date, /24/);
  assert.equal(selectWidgetEntry(entries, midnight)?.summary?.prayer, "Isha");
  assert.equal(selectWidgetEntry(entries, midnight)?.prayer, "Fajr");
  const early = buildHomeWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, new Date(day.instants.Fajr.getTime() - 1000));
  const afterSunrise = selectWidgetEntry(early, day.instants.Sunrise.getTime())!;
  assert.equal(afterSunrise.summary?.label, "Next prayer");
  assert.equal(afterSunrise.summary?.prayer, "Dhuhr");
  assert.ok(afterSunrise.summary?.rows.every(row => !row.active));
  assert.ok(entries.length < 200);
  assert.equal(entries.at(-1)?.props.empty, true);
  assert.equal(entries.at(-1)?.props.summary, undefined);
  assert.ok(entries.every((entry, index) => index === 0 || entry.timestamp > entries[index - 1].timestamp));
});

test("day summary respects the app's automatic Ramadan preference and language", () => {
  const reference = new Date("2026-02-25T06:00:00Z");
  const ramadan = calculatePrayerCalendar(dhaka, DEFAULT_SETTINGS, reference, 1, 15);
  const props = buildHomeWidgetTimeline(ramadan, dhaka, { ...DEFAULT_SETTINGS, ramadanMode: "auto", language: "ar" }, reference)[0].props;
  assert.ok(props.summary?.sehri);
  assert.match(props.summary!.hijri, /[\u0600-\u06ff]/);
  assert.equal(props.summary?.rows[0].name, "الفجر");
  const normal = buildHomeWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, ramadanMode: "auto" }, now)[0].props;
  assert.equal(normal.summary?.sehri, "");
});

test("summary midnight transitions follow the selected city through daylight saving", () => {
  const city = { ...dhaka, name: "New York", lat: 40.7128, lng: -74.006, countryCode: "US", timeZone: "America/New_York" };
  const reference = new Date("2026-10-31T12:00:00Z");
  const days = calculatePrayerCalendar(city, DEFAULT_SETTINGS, reference, 1, 15);
  const entries = buildHomeWidgetTimeline(days, city, DEFAULT_SETTINGS, reference);
  for (const midnight of ["2026-11-01T04:00:00Z", "2026-11-02T05:00:00Z"]) {
    assert.ok(entries.some(entry => entry.timestamp === new Date(midnight).getTime()), midnight);
  }
  assert.ok(entries.every((entry, index) => index === 0 || entry.timestamp > entries[index - 1].timestamp));
});

test("widget advances at each prayer boundary, excluding sunrise", () => {
  const day = calculatePrayerDay(dhaka, DEFAULT_SETTINGS, "2026-10-23");
  const before = new Date(day.instants.Fajr.getTime() - 1000);
  const entries = buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, before);
  assert.equal(entries[0].props.prayer, "Fajr");
  assert.equal(selectWidgetEntry(entries, day.instants.Fajr.getTime())?.prayer, "Dhuhr");
  assert.equal(selectWidgetEntry(entries, day.instants.Sunrise.getTime())?.prayer, "Dhuhr");
  assert.equal(selectWidgetEntry(entries, day.instants.Isha.getTime())?.prayer, "Fajr");
  assert.match(selectWidgetEntry(entries, day.instants.Isha.getTime())!.date, /24/);
  const atDhuhr = buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, day.instants.Dhuhr);
  assert.equal(atDhuhr[0].props.prayer, "Asr");
});

test("widget saves fourteen calendar days, then removes all expired prayer times", () => {
  const beforeFajr = new Date("2026-10-22T20:00:00Z"); // Oct 23 in Dhaka.
  const entries = buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, beforeFajr);
  assert.equal(entries.length, 71); // 70 prayers and one expiry entry; no notification quota involved.
  const lastPrayer = calculatePrayerDay(dhaka, DEFAULT_SETTINGS, "2026-11-05").instants.Isha.getTime();
  assert.equal(entries.at(-1)?.timestamp, lastPrayer);
  assert.equal(selectWidgetEntry(entries, lastPrayer)?.empty, true);
  assert.equal(selectWidgetEntry(entries, lastPrayer + 30 * 86400000)?.time, "");
  assert.equal(selectWidgetEntry(entries, lastPrayer)?.prayer, "Refresh prayer times");
  assert.ok(entries.every((entry, i) => i === 0 || entry.timestamp > entries[i - 1].timestamp));
});

test("empty, unavailable and expired calendars display setup/refresh prompts", () => {
  assert.equal(buildWidgetTimeline([], null, DEFAULT_SETTINGS, now)[0].props.prayer, "Choose your location");
  assert.equal(buildWidgetTimeline([], dhaka, DEFAULT_SETTINGS, now)[0].props.prayer, "Refresh prayer times");
  const expired = buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, new Date("2027-01-01"));
  assert.equal(expired[0].props.time, "");
  assert.equal(expired.length, 1);
});

test("widget follows language, time format, theme and newly selected locations", () => {
  const bangla = buildWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, language: "bn" }, now)[0].props;
  assert.match(bangla.prayer, /[\u0980-\u09ff]/);
  assert.equal(bangla.label, "পরবর্তী নামাজ");
  assert.match(bangla.time, /[০-৯]/);
  const arabic = buildWidgetTimeline(calendar, dhaka, { ...DEFAULT_SETTINGS, language: "ar", timeFormat: "24h", themeMode: "dark" }, now)[0].props;
  assert.equal(arabic.isRTL, true);
  assert.equal(arabic.theme, "dark");
  assert.match(arabic.time, /[٠-٩]/);
  const london = { ...dhaka, name: "London", lat: 51.5074, lng: -0.1278, timeZone: "Europe/London", countryCode: "GB" };
  const moved = buildWidgetTimeline(calculatePrayerCalendar(london, DEFAULT_SETTINGS, now), london, { ...DEFAULT_SETTINGS, timeFormat: "24h" }, now)[0].props;
  assert.equal(moved.location, "London");
  assert.doesNotMatch(moved.time, /AM|PM/);
  assert.notEqual(moved.time, buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, now)[0].props.time);
});

test("widget dates and instants remain ordered through daylight saving and device time zones", () => {
  const location = { ...dhaka, name: "New York", lat: 40.7128, lng: -74.006, countryCode: "US", timeZone: "America/New_York" };
  const reference = new Date("2026-10-31T03:30:00Z");
  const days = calculatePrayerCalendar(location, DEFAULT_SETTINGS, reference, 0, 15);
  const entries = buildWidgetTimeline(days, location, DEFAULT_SETTINGS, reference);
  assert.ok(entries.every((entry, i) => i === 0 || entry.timestamp > entries[i - 1].timestamp));
  assert.equal(entries.at(-1)?.timestamp, calculatePrayerDay(location, DEFAULT_SETTINGS, "2026-11-12").instants.Isha.getTime());
});

test("queued widget updates cannot overwrite a newer location, and recover from failed writes", async () => {
  const entries = buildWidgetTimeline(calendar, dhaka, DEFAULT_SETTINGS, now);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const saved: string[] = [];
  const publish = createWidgetPublisher(async data => {
    if (data[0].props.location === "first") { await gate; throw new Error("storage unavailable"); }
    saved.push(data[0].props.location);
  });
  const forCity = (location: string) => [{ ...entries[0], props: { ...entries[0].props, location } }];
  const first = publish(forCity("first"));
  const failure = assert.rejects(first, /storage unavailable/);
  await new Promise(resolve => setImmediate(resolve));
  const second = publish(forCity("old"));
  const latest = publish(forCity("new"));
  release();
  await Promise.all([failure, second, latest]);
  assert.deepEqual(saved, ["new"]);
});

test("widget payload preserves classic dark appearance for isolated native renderers", () => {
  const props = buildWidgetTimeline(calendar, dhaka, {...DEFAULT_SETTINGS, themeMode: "classic-dark"}, new Date("2026-10-23T10:00:00Z"))[0].props;
  assert.equal(props.theme, "classic-dark");
});
