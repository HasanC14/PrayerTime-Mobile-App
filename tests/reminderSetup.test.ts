import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../src/constants/settings";
import { enableReminderSelection, reminderSetupStep, reminderTimingKey } from "../src/services/reminderSetup";
import type { NotificationAccess } from "../src/types";

const granted: NotificationAccess = { status: "granted", canAskAgain: true, channelBlocked: false, soundEnabled: true, bannersEnabled: true };

test("notification access comes before precise timing in reminder setup", () => {
  assert.equal(reminderSetupStep({ ...granted, status: "denied" }, false), "notifications");
  assert.equal(reminderSetupStep({ ...granted, status: "blocked" }, true), "notifications");
  assert.equal(reminderSetupStep({ ...granted, channelBlocked: true }, false), "notifications");
  assert.equal(reminderSetupStep(granted, false), "timing");
});

test("allowed timing and non-Android previews need no extra setup step", () => {
  assert.equal(reminderSetupStep(granted, true), null);
  assert.equal(reminderSetupStep(granted, null), null);
});

test("notifications remain enabled when precise timing is unavailable", () => {
  const enabled = enableReminderSelection(DEFAULT_SETTINGS, "all");
  assert.equal(enabled.notificationsEnabled, true);
  assert.equal(reminderSetupStep(granted, false), "timing");
  assert.deepEqual(enabled.prayerAlarmMinutes, DEFAULT_SETTINGS.prayerAlarmMinutes);
});

test("master reminder toggle restores existing prayer choices", () => {
  const current = { ...DEFAULT_SETTINGS, prayerAlarmMinutes: { Fajr: 20, Dhuhr: null, Asr: null, Maghrib: 20, Isha: null } };
  const enabled = enableReminderSelection(current, "all");
  assert.equal(enabled.notificationsEnabled, true);
  assert.deepEqual(enabled.prayerAlarmMinutes, current.prayerAlarmMinutes);
  assert.equal(current.notificationsEnabled, false);
});

test("master enable selects every prayer if all prayers were individually disabled", () => {
  const current = { ...DEFAULT_SETTINGS, alarmLeadMinutes: 15, prayerAlarmMinutes: { Fajr: null, Dhuhr: null, Asr: null, Maghrib: null, Isha: null } };
  assert.deepEqual(enableReminderSelection(current, "all").prayerAlarmMinutes, { Fajr: 15, Dhuhr: 15, Asr: 15, Maghrib: 15, Isha: 15 });
});

test("a Home bell enables only the chosen prayer when reminders were off", () => {
  const enabled = enableReminderSelection(DEFAULT_SETTINGS, "Isha");
  assert.equal(enabled.notificationsEnabled, true);
  assert.deepEqual(enabled.prayerAlarmMinutes, { Fajr: null, Dhuhr: null, Asr: null, Maghrib: null, Isha: 30 });
  const another = enableReminderSelection(enabled, "Fajr");
  assert.deepEqual(another.prayerAlarmMinutes, { Fajr: 30, Dhuhr: null, Asr: null, Maghrib: null, Isha: 30 });
});

test("timing identities change when permission changes so reminders are refreshed", () => {
  assert.notEqual(reminderTimingKey(false), reminderTimingKey(true));
  assert.notEqual(reminderTimingKey(null), reminderTimingKey(true));
  assert.equal(reminderTimingKey(false), reminderTimingKey(false));
});
