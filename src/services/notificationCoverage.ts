export interface NotificationCoverage { updatedAt: number; until: number; count: number; }
export function parseNotificationCoverage(raw: string | null): NotificationCoverage | null {
  try {
    const value = JSON.parse(raw ?? "null");
    const date = (number: unknown) => typeof number === "number" && Number.isFinite(number) && Number.isFinite(new Date(number).getTime());
    return value && date(value.updatedAt) && date(value.until) && value.until >= value.updatedAt && Number.isInteger(value.count) && value.count >= 0
      ? {updatedAt: value.updatedAt, until: value.until, count: value.count} : null;
  } catch {return null;}
}
export function getNotificationCoverage(dates: readonly Date[], now = Date.now()): NotificationCoverage {
  const future = dates.map(date => date.getTime()).filter(value => Number.isFinite(value) && value > now);
  return {updatedAt: now, until: future.length ? Math.max(...future) : now, count: future.length};
}
