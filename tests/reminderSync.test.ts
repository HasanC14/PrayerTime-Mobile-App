import assert from "node:assert/strict";
import test from "node:test";
import { syncPrayerReminders, type PendingReminder, type ReminderAdapter } from "../src/services/reminderSync";
import { reminderTimingKey } from "../src/services/reminderSetup";

function harness(identifiers: string[] = []) {
  const pending = new Map<string, PendingReminder>(identifiers.map((identifier) => [identifier, { identifier, content: { data: { kind: "prayer-end-alarm" } } }]));
  let saved: string[] = [];
  let peakPending = pending.size;
  const scheduled: string[] = [];
  const adapter: ReminderAdapter<{ identifier: string }> = {
    list: async () => [...pending.values()],
    savedIds: async () => saved,
    cancel: async (id) => { pending.delete(id); },
    schedule: async ({ identifier }) => {
      pending.set(identifier, { identifier, content: { data: { kind: "prayer-end-alarm" } } });
      scheduled.push(identifier);
      peakPending = Math.max(peakPending, pending.size);
      return identifier;
    },
    saveIds: async (ids) => { saved = ids; }
  };
  return { pending, scheduled, adapter, saved: () => saved, peak: () => peakPending };
}

test("resuming repeatedly retains existing reminders without duplicates", async () => {
  const h = harness(["fajr"]);
  const desired = [{ identifier: "fajr" }, { identifier: "isha" }];
  assert.equal(await syncPrayerReminders(desired, h.adapter), 2);
  assert.equal(await syncPrayerReminders(desired, h.adapter), 2);
  assert.deepEqual(h.scheduled, ["isha"]);
});

test("granting precise timing replaces existing inexact reminders without duplicates", async () => {
  const oldId = `prayer-end:Fajr:123:30:${reminderTimingKey(false)}`;
  const newId = `prayer-end:Fajr:123:30:${reminderTimingKey(true)}`;
  const h = harness([oldId]);
  await syncPrayerReminders([{ identifier: newId }], h.adapter);
  await syncPrayerReminders([{ identifier: newId }], h.adapter);
  assert.deepEqual([...h.pending.keys()], [newId]);
  assert.deepEqual(h.scheduled, [newId]);
});

test("a city change replaces each platform's full reminder window without duplicate alarms", async () => {
  for (const limit of [60, 70]) {
    const h = harness(Array.from({ length: limit }, (_, i) => `old-${i}`));
    await syncPrayerReminders(Array.from({ length: limit }, (_, i) => ({ identifier: `new-${i}` })), h.adapter);
    assert.equal(h.pending.size, limit);
    assert.equal(h.peak(), limit);
    assert.ok([...h.pending.keys()].every((id) => id.startsWith("new-")));
  }
});

test("disabling finds orphaned alarms in the OS while preserving unrelated notifications", async () => {
  const h = harness(["orphan"]);
  h.pending.set("other", { identifier: "other", content: { data: { kind: "other-feature" } } });
  await syncPrayerReminders([], h.adapter);
  assert.deepEqual([...h.pending.keys()], ["other"]);
  assert.deepEqual(h.saved(), []);
});

test("a partially interrupted schedule is recovered on the next sync", async () => {
  const h = harness();
  const schedule = h.adapter.schedule;
  h.adapter.schedule = async (reminder) => {
    if (reminder.identifier === "second") throw new Error("OS unavailable");
    return schedule(reminder);
  };
  const desired = [{ identifier: "first" }, { identifier: "second" }];
  await assert.rejects(syncPrayerReminders(desired, h.adapter), /OS unavailable/);
  assert.deepEqual(h.saved(), ["first"]);
  h.adapter.schedule = schedule;
  assert.equal(await syncPrayerReminders(desired, h.adapter), 2);
  assert.deepEqual(h.scheduled, ["first", "second"]);
});

test("cancellation failures remain tracked and are reported for retry", async () => {
  const h = harness(["old-city"]);
  h.adapter.cancel = async () => { throw new Error("OS unavailable"); };
  await assert.rejects(syncPrayerReminders([{ identifier: "new-city" }], h.adapter), /could not be cancelled/);
  assert.deepEqual(h.saved(), ["old-city"]);
  assert.deepEqual(h.scheduled, []);
});

test("unreadable saved IDs do not prevent disabling metadata-owned prayer reminders", async () => {
  const h = harness(["prayer-reminder"]);
  h.adapter.savedIds = async () => { throw new Error("Storage unavailable"); };
  h.pending.set("other", { identifier: "other", content: { data: { kind: "other-feature" } } });
  await syncPrayerReminders([], h.adapter);
  assert.deepEqual([...h.pending.keys()], ["other"]);
});

test("failed persistence after scheduling is recovered from OS metadata on the next sync", async () => {
  const h = harness();
  const save = h.adapter.saveIds;
  h.adapter.saveIds = async () => { throw new Error("Storage full"); };
  await assert.rejects(syncPrayerReminders([{ identifier: "fajr" }], h.adapter), /Storage full/);
  assert.equal(h.pending.size, 1);
  h.adapter.saveIds = save;
  await syncPrayerReminders([{ identifier: "fajr" }], h.adapter);
  assert.deepEqual(h.scheduled, ["fajr"]);
  assert.deepEqual(h.saved(), ["fajr"]);
});
