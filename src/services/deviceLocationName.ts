import type { AppLocation } from "../types";
import { distanceInMeters, hasLocationName } from "./locationPolicy";

export const LOCATION_NAME_RETRY_MS = 60_000;
type PlaceName = { name: string; countryCode?: string };
type ResolveOptions = { retryNow?: boolean };

// Apply only the label, retaining the latest GPS coordinates and manual selections.
export function mergeDeviceLocationName(current: AppLocation | null, requested: AppLocation, named: AppLocation): AppLocation | null {
  if (!current || current.source !== "device" || hasLocationName(current) || !hasLocationName(named) ||
    current.timeZone !== requested.timeZone || distanceInMeters(current, requested) >= 1000) return current;
  return { ...current, name: named.name, countryCode: named.countryCode };
}

// A city label is optional. Failed lookups must leave the GPS fix usable.
export function createLocationNameResolver(
  lookup: (lat: number, lng: number) => Promise<PlaceName>,
  now: () => number = Date.now
): (location: AppLocation, options?: ResolveOptions) => Promise<AppLocation> {
  let cached: AppLocation | null = null;
  let retryAfter = 0;
  let pending: { location: AppLocation; promise: Promise<PlaceName> } | null = null;
  const nearby = (a: AppLocation, b: AppLocation) => a.timeZone === b.timeZone && distanceInMeters(a, b) < 1000;

  return async (location, options) => {
    if (hasLocationName(location)) {
      cached = location;
      return location;
    }
    if (cached && nearby(cached, location)) {
      return { ...location, name: cached.name, countryCode: cached.countryCode };
    }
    if (!options?.retryNow && now() < retryAfter) return location;

    const request = pending && nearby(pending.location, location) ? pending : {
      location,
      promise: Promise.resolve().then(() => lookup(location.lat, location.lng)),
    };
    pending = request;
    try {
      const place = await request.promise;
      const named = { ...location, ...place };
      if (!cached || location.capturedAt >= cached.capturedAt) cached = named;
      retryAfter = 0;
      return named;
    } catch {
      retryAfter = now() + LOCATION_NAME_RETRY_MS;
      return location;
    } finally {
      if (pending === request) pending = null;
    }
  };
}
