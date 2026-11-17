import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import { buildPrayerNotificationPlan } from "../src/services/prayerNotificationPlan";
import { calculatePrayerCalendar } from "../src/services/prayerTimes";
import { validateSettings } from "../src/services/storage";
import { enableReminderSelection } from "../src/services/reminderSetup";
import { PRAYER_NAMES } from "../src/types";

const now = new Date("2026-11-03T20:00:00Z"); // Before Fajr in Dhaka.
const calendar = calculatePrayerCalendar(FALLBACK_LOCATION, DEFAULT_SETTINGS, now, 1, 15);
const startsOnly = {...DEFAULT_SETTINGS, prayerStartNotificationsEnabled: true};

test("start alerts are opt-in, migrate safely, and can be enabled independently of end reminders", () => {
  assert.equal(validateSettings({notificationsEnabled: true}).prayerStartNotificationsEnabled, false);
  assert.equal(validateSettings({...startsOnly}).prayerStartNotificationsEnabled, true);
  assert.equal(validateSettings({prayerStartNotificationsEnabled: "true"}).prayerStartNotificationsEnabled, false);
  assert.deepEqual(enableReminderSelection(DEFAULT_SETTINGS, "starts"), startsOnly);
  assert.deepEqual(buildPrayerNotificationPlan(calendar, DEFAULT_SETTINGS, "android", now), []);
});

test("start-only alerts fire at all five exact start instants and exclude sunrise and Doha", () => {
  const plan = buildPrayerNotificationPlan(calendar, startsOnly, "android", now);
  const nextDay = calendar.find(day => day.dateKey === "2026-11-04")!;
  const firstDay = plan.filter(item => item.content.data.dateKey === nextDay.dateKey);
  assert.deepEqual(firstDay.map(item => item.content.data.prayer), [...PRAYER_NAMES]);
  for (const item of firstDay) {
    assert.equal(item.date.getTime(), nextDay.instants[item.content.data.prayer].getTime());
    assert.equal(item.content.data.kind, "prayer-start-alarm");
    assert.equal(item.content.title, `${item.content.data.prayer} time has started`);
  }
  assert.ok(plan.every(item => item.date > now));
  // End-reminder bell choices do not disable start alerts.
  const allEndBellsOff = {...startsOnly, prayerAlarmMinutes: {Fajr: null, Dhuhr: null, Asr: null, Maghrib: null, Isha: null}};
  assert.deepEqual(buildPrayerNotificationPlan(calendar, allEndBellsOff, "android", now), plan);
});

test("both kinds share the nearest-first iOS budget while Android retains fourteen days", () => {
  const both = {...startsOnly, notificationsEnabled: true};
  const ios = buildPrayerNotificationPlan(calendar, both, "ios", now);
  assert.equal(ios.length, 60);
  assert.equal(new Set(ios.map(item => item.identifier)).size, 60);
  assert.ok(ios.some(item => item.content.data.kind === "prayer-start-alarm"));
  assert.ok(ios.some(item => item.content.data.kind === "prayer-end-alarm"));
  assert.ok(ios.every((item, index) => index === 0 || item.date >= ios[index - 1].date));
  const android = buildPrayerNotificationPlan(calendar, both, "android", now);
  assert.ok(android.length > 130 && android.length <= 140);
  assert.ok(android.at(-1)!.date.getTime() > now.getTime() + 13 * 86_400_000);
  const endOnly = buildPrayerNotificationPlan(calendar, {...both, prayerStartNotificationsEnabled: false}, "android", now);
  assert.ok(endOnly.every(item => item.content.data.kind === "prayer-end-alarm"));
  assert.deepEqual(android.filter(item => item.content.data.kind === "prayer-end-alarm"), endOnly);
});

test("start notifications localize prayer names and reschedule when language or timing access changes", () => {
  const english = buildPrayerNotificationPlan(calendar, startsOnly, "android", now);
  const bangla = buildPrayerNotificationPlan(calendar, startsOnly, "android", now, true, "bn");
  const arabic = buildPrayerNotificationPlan(calendar, startsOnly, "android", now, true, "ar");
  assert.equal(bangla[0].content.title, "ফজর নামাজের ওয়াক্ত শুরু হয়েছে");
  assert.equal(arabic[0].content.title, "بدأ وقت الفجر");
  assert.notEqual(english[0].identifier, bangla[0].identifier);
  assert.notEqual(buildPrayerNotificationPlan(calendar, startsOnly, "android", now, false)[0].identifier,
    buildPrayerNotificationPlan(calendar, startsOnly, "android", now, true)[0].identifier);
  const afterStart = buildPrayerNotificationPlan(calendar, startsOnly, "android", english[0].date);
  assert.ok(afterStart.every(item => item.date > english[0].date));
});
