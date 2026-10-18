import type { AppLocation } from "../types";

export const LOCATION_STALE_MS = 15 * 60_000;

export function distanceInMeters(a: Pick<AppLocation, "lat" | "lng">, b: Pick<AppLocation, "lat" | "lng">): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const h = Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(radians(b.lng - a.lng) / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
}

// Prayer times need city-level movement, not every GPS fluctuation.
export function shouldApplyDeviceUpdate(current: AppLocation | null, next: AppLocation): boolean {
  if (!current || current.source !== "device") return true;
  if (next.capturedAt < current.capturedAt) return false;
  return distanceInMeters(current, next) >= Math.max(1000, next.accuracy ?? 0) ||
    next.capturedAt - current.capturedAt >= LOCATION_STALE_MS ||
    (current.accuracy !== undefined && next.accuracy !== undefined &&
      current.accuracy > 1000 && next.accuracy < current.accuracy / 2);
}

export function shouldRestoreDeviceLocation(location: AppLocation | null): boolean {
  return location?.source === "device";
}
