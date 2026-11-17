import { PRAYER_EVENTS, type PrayerDay } from "../types";
import { getPrayerGuidanceWindows } from "../utils/time";

// Compare boundaries with the time used to render, rather than skipping a
// boundary that passed between rendering and installing the timer.
export function prayerClockDelay(renderedAt: Date, calendar: PrayerDay[], wallTime = Date.now()): number {
  const next = calendar.flatMap(day => [
    ...PRAYER_EVENTS.map(name => day.instants[name].getTime()),
    ...getPrayerGuidanceWindows(day).flatMap(window => [window.start.getTime(), window.end.getTime()])
  ]).filter(timestamp => Number.isFinite(timestamp) && timestamp > renderedAt.getTime())
    .sort((a, b) => a - b)[0];
  // A heartbeat catches clock changes and local midnight; a small margin avoids
  // early timer callbacks repeatedly rendering the outgoing period.
  return next === undefined ? 30_000 : Math.max(1, Math.min(30_000, next - wallTime + 25));
}
