import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PRAYER_ALARMS, DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import { calculatePrayerCalendar } from "../src/services/prayerTimes";
import { getPrayerAlarmOccurrences } from "../src/services/prayerPeriods";
import { getReminderWindow, REMINDER_CALENDAR_DAYS } from "../src/services/reminderWindow";

const dayMs = 24 * 60 * 60_000;

test("Android prepares fourteen days while iPhone stays within sixty pending reminders", () => {
  assert.deepEqual(getReminderWindow("android"), { days: 14, maxNotifications: 70 });
  assert.deepEqual(getReminderWindow("ios"), { days: 12, maxNotifications: 60 });
});

test("reminder windows include the full forward range across month and year boundaries", () => {
  for (const platform of ["android", "ios"]) {
    const window = getReminderWindow(platform);
    for (const value of ["2026-10-19T11:07:00Z", "2026-12-30T20:00:00Z"]) {
      const now = new Date(value);
      const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, DEFAULT_SETTINGS, now, 1, REMINDER_CALENDAR_DAYS);
      const reminders = getPrayerAlarmOccurrences(calendar, DEFAULT_PRAYER_ALARMS, now, window.days).slice(0, window.maxNotifications);
      assert.ok(reminders.length >= window.maxNotifications - 1);
      assert.ok(reminders.length <= window.maxNotifications);
      assert.ok(reminders.at(-1)!.trigger.getTime() > now.getTime() + (window.days - 1) * dayMs);
      assert.ok(reminders.every(item => item.trigger > now && item.trigger.getTime() <= now.getTime() + window.days * dayMs));
    }
  }
});

test("Isha ending tomorrow remains included when its prayer date was yesterday", () => {
  const now = new Date("2026-10-19T20:00:00Z"); // 02:00 in Dhaka; previous day's Isha is active.
  const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, DEFAULT_SETTINGS, now, 1, REMINDER_CALENDAR_DAYS);
  const reminders = getPrayerAlarmOccurrences(calendar, DEFAULT_PRAYER_ALARMS, now, 14);
  assert.equal(reminders[0].prayer, "Isha");
  assert.equal(reminders[0].dateKey, "2026-10-19");
  assert.ok(reminders.at(-1)!.trigger.getTime() > now.getTime() + 13 * dayMs);
});

test("disabling prayers reduces notifications without extending the requested time window", () => {
  const now = new Date("2026-10-19T11:07:00Z");
  const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, DEFAULT_SETTINGS, now, 1, REMINDER_CALENDAR_DAYS);
  const fajrOnly = { Fajr: 30, Dhuhr: null, Asr: null, Maghrib: null, Isha: null };
  const reminders = getPrayerAlarmOccurrences(calendar, fajrOnly, now, 14);
  assert.equal(reminders.length, 14);
  assert.ok(reminders.every(item => item.prayer === "Fajr" && item.trigger.getTime() <= now.getTime() + 14 * dayMs));
});
