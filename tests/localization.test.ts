import assert from "node:assert/strict";
import test from "node:test";
import { messages } from "../src/i18n/messages";
import { localizeDigits, normalizeDigits, translateMessage, weekdayShort } from "../src/i18n/translate";
import { validateSettings } from "../src/services/storage";
import { DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import { calculatePrayerDay } from "../src/services/prayerTimes";
import { formatDuration, formatLongDate, formatPrayerTime, formatPrayerTimeRange } from "../src/utils/time";

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();

test("both language catalogs retain every interpolation value", () => {
  for (const [source, translations] of Object.entries(messages)) {
    for (const translation of translations) {
      assert.ok(translation.trim(), source);
      assert.deepEqual(placeholders(translation), placeholders(source), source);
    }
  }
});

test("existing installs default to English and saved languages survive validation", () => {
  assert.equal(validateSettings({}).language, "en");
  assert.equal(validateSettings({ language: "unknown" }).language, "en");
  for (const language of ["bn", "ar", "en"]) assert.equal(validateSettings({ language }).language, language);
});

test("notifications translate prayer names and numbers without leftover placeholders", () => {
  assert.equal(translateMessage("{prayer} ends in {minutes} minutes.", "bn", { prayer: "Asr", minutes: 20 }), "২০ মিনিট পর আসর নামাজের ওয়াক্ত শেষ হবে।");
  assert.equal(translateMessage("{prayer} time ending soon", "ar", { prayer: "Asr" }), "وقت العصر ينتهي قريبًا");
  assert.equal(translateMessage("{prayer} ends in {minutes} minutes.", "en", { prayer: "Asr", minutes: 20 }), "Asr ends in 20 minutes.");
});

test("composed UI strings translate completely, while city names are preserved", () => {
  assert.equal(translateMessage("Close Reminder timing", "ar"), "إغلاق توقيت التذكير");
  assert.equal(translateMessage("7 Jumada I 1448 AH", "bn"), "৭ জমাদিউল আউয়াল ১৪৪৮ হিজরি");
  assert.equal(translateMessage("Automatic · Karachi", "ar"), "تلقائي · كراتشي");
  assert.equal(translateMessage("Version 1.0.0 · Made for your daily rhythm", "bn"), "সংস্করণ ১.০.০ · আপনার প্রতিদিনের সঙ্গী");
  assert.equal(translateMessage("Birmingham", "ar"), "Birmingham");
  assert.equal(translateMessage("Islam", "bn"), "Islam");
  assert.equal(translateMessage("প্রদর্শন", "bn"), "প্রদর্শন");
});

test("localized number entry round-trips Bangla, Arabic and Persian keyboard digits", () => {
  assert.equal(normalizeDigits("২৫"), "25");
  assert.equal(normalizeDigits("٣٠"), "30");
  assert.equal(normalizeDigits("۴۵"), "45");
  assert.equal(normalizeDigits(localizeDigits(60, "ar")), "60");
  assert.equal(normalizeDigits(localizeDigits(10, "bn")), "10");
});

test("time and date formatting use the selected language and location timezone", () => {
  const start = new Date("2026-10-19T22:30:00Z");
  const end = new Date("2026-10-19T23:45:00Z");
  assert.equal(formatPrayerTime(start, "24h", "Asia/Dhaka", "bn"), "০৪:৩০");
  assert.equal(formatPrayerTimeRange(start, end, "12h", "Asia/Dhaka", "bn"), "৪:৩০ – ৫:৪৫ পূর্বাহ্ণ");
  assert.match(formatPrayerTime(start, "12h", "Asia/Dhaka", "ar"), /٤:٣٠/);
  assert.match(formatLongDate(start, "Asia/Dhaka", "bn"), /২০ অক্টোবর/);
  assert.match(formatLongDate(start, "Asia/Dhaka", "ar"), /٢٠ أكتوبر/);
  assert.equal(formatDuration(65 * 60_000, "bn"), "১ঘ ০৫মি");
  assert.equal(formatDuration(0, "ar"), "الآن");
  assert.equal(weekdayShort("Saturday", "bn"), "শনি");
  assert.equal(weekdayShort("Saturday", "ar"), "س");
});

test("changing display language leaves prayer instants and date keys unchanged", () => {
  const english = calculatePrayerDay(FALLBACK_LOCATION, DEFAULT_SETTINGS, "2026-10-19");
  for (const language of ["bn", "ar"] as const) {
    const localized = calculatePrayerDay(FALLBACK_LOCATION, { ...DEFAULT_SETTINGS, language }, "2026-10-19");
    assert.deepEqual(localized, english);
  }
});
