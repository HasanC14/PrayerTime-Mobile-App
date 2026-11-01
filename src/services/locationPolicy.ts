import type { AppLocation } from "../types";

export const LOCATION_STALE_MS = 15 * 60_000;

export function hasLocationName(location: AppLocation): boolean {
  const name = location.name.trim().toLowerCase();
  return Boolean(name) && !["current location", "saved location", "selected location"].includes(name);
}

export function distanceInMeters(a: Pick<AppLocation, "lat" | "lng">, b: Pick<AppLocation, "lat" | "lng">): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const h = Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(radians(b.lng - a.lng) / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

// Prayer times need city-level movement, not every GPS fluctuation.
export function shouldApplyDeviceUpdate(current: AppLocation | null, next: AppLocation): boolean {
  if (!Number.isFinite(next.lat) || Math.abs(next.lat) > 90 || !Number.isFinite(next.lng) || Math.abs(next.lng) > 180 || !Number.isFinite(next.capturedAt)) return false;
  if (!current || current.source !== "device") return true;
  if (next.capturedAt < current.capturedAt) return false;
  const accuracy = Number.isFinite(next.accuracy) ? Math.max(0, next.accuracy ?? 0) : 0;
  return current.timeZone !== next.timeZone ||
    distanceInMeters(current, next) >= Math.max(1000, accuracy) ||
    next.capturedAt - current.capturedAt >= LOCATION_STALE_MS ||
    (current.accuracy !== undefined && next.accuracy !== undefined &&
      current.accuracy > 1000 && next.accuracy < current.accuracy / 2);
}

export function shouldRestoreDeviceLocation(location: AppLocation | null, now = Date.now()): boolean {
  return location?.source === "device" && now - location.capturedAt >= LOCATION_STALE_MS;
}
