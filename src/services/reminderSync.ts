export interface PendingReminder {
  identifier: string;
  content: { data?: Record<string, unknown> };
}

export interface ReminderAdapter<T extends { identifier: string }> {
  list: () => Promise<PendingReminder[]>;
  savedIds: () => Promise<string[]>;
  cancel: (identifier: string) => Promise<void>;
  schedule: (reminder: T) => Promise<string>;
  saveIds: (identifiers: string[]) => Promise<void>;
}

// Reconcile with the OS, not just storage: an interrupted write must not orphan alarms.
export async function syncPrayerReminders<T extends { identifier: string }>(
  desired: T[], adapter: ReminderAdapter<T>
): Promise<number> {
  // Notification metadata still identifies our reminders if local storage cannot be read.
  const [pending, savedIds] = await Promise.all([adapter.list(), adapter.savedIds().catch(() => [])]);
  const saved = new Set(savedIds);
  const desiredIds = new Set(desired.map((item) => item.identifier));
  const owned = pending.filter((item) => saved.has(item.identifier) || item.content.data?.kind === "prayer-end-alarm");
  const obsolete = owned.filter((item) => !desiredIds.has(item.identifier));
  const cancellation = await Promise.allSettled(obsolete.map((item) => adapter.cancel(item.identifier)));
  const failed = obsolete.filter((_, index) => cancellation[index].status === "rejected").map((item) => item.identifier);
  const kept = owned.filter((item) => desiredIds.has(item.identifier)).map((item) => item.identifier);
  if (failed.length) {
    await adapter.saveIds([...kept, ...failed]);
    throw new Error("Some previous prayer reminders could not be cancelled.");
  }

  const active = new Set(kept);
  try {
    for (const reminder of desired) {
      if (!active.has(reminder.identifier)) active.add(await adapter.schedule(reminder));
    }
  } finally {
    // Keep successful reminders when scheduling is interrupted; the next sync fills the gaps.
    await adapter.saveIds([...active]);
  }
  return active.size;
}
