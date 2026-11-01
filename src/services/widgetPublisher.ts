import type { PrayerWidgetEntry } from "./widgetTimeline";

// Serialize native writes so a slower update for an old location cannot overwrite
// a newer selection. Skip queued updates superseded before they start.
export function createWidgetPublisher(publish: (entries: PrayerWidgetEntry[]) => Promise<void>) {
  let queue = Promise.resolve();
  let revision = 0;
  return (entries: PrayerWidgetEntry[]): Promise<void> => {
    const requested = ++revision;
    const task = queue.catch(() => undefined).then(async () => {
      if (requested === revision) await publish(entries);
    });
    queue = task;
    return task;
  };
}
