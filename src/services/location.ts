import { Linking, Platform } from "react-native";
import * as Location from "expo-location";
import tzLookup from "tz-lookup";

import { formatLocationIqName, reverseGeocodeLocation } from "./locationIq";
import { createLocationNameResolver } from "./deviceLocationName";
import type { AppLocation } from "../types";

import { DeviceLocationError, toLocationIssue } from "./locationErrors";
import { requestDeviceLocationAccess } from "./deviceLocationAccess";
import { waitForLocationFix } from "./locationFix";

export { DeviceLocationError, toLocationIssue };

const LAST_KNOWN_MAX_AGE_MS = 15 * 60_000;

export async function ensureForegroundLocationPermission(requestIfNeeded: boolean): Promise<void> {
  await requestDeviceLocationAccess({
    getPermission: Location.getForegroundPermissionsAsync,
    requestPermission: Location.requestForegroundPermissionsAsync,
    servicesEnabled: () => Platform.OS === "web" ? Promise.resolve(true) : Location.hasServicesEnabledAsync(),
    ...(Platform.OS === "android" ? {
      offerLocationServices: async () => {
        const providers = await Location.getProviderStatusAsync();
        if (!providers.locationServicesEnabled || providers.networkAvailable === false) {
          await Location.enableNetworkProviderAsync();
        }
      }
    } : {})
  }, requestIfNeeded);
}

function positionToLocation(position: Location.LocationObject, fixKind: "current" | "cached" = "current"): AppLocation {
  const { latitude, longitude, accuracy } = position.coords;

  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  try {
    timeZone = tzLookup(latitude, longitude);
  } catch (error) {
    console.warn("Unable to resolve the location timezone", error);
  }

  return {
    name: "Current location",
    lat: latitude,
    lng: longitude,
    source: "device",
    fixKind,
    timeZone,
    accuracy: accuracy ?? undefined,
    capturedAt: position.timestamp || Date.now()
  };
}

async function lookupDeviceLocationName(lat: number, lng: number) {
  try {
    return await reverseGeocodeLocation(lat, lng);
  } catch (error) {
    if (Platform.OS === "web") throw error;
    // The phone's geocoder is an independent fallback if LocationIQ is unavailable.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const places = await Promise.race([
      Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(error), 10_000); })
    ]).finally(() => { if (timer) clearTimeout(timer); });
    const place = places[0];
    if (!place) throw error;
    const name = formatLocationIqName({ address: {
      city: place.city ?? undefined,
      city_district: place.district ?? undefined,
      county: place.subregion ?? undefined,
      state: place.region ?? undefined,
      country: place.country ?? undefined
    } });
    if (name === "Selected location") throw error;
    return { name, countryCode: place.isoCountryCode?.toUpperCase() };
  }
}

// Naming is optional: GPS and offline prayer calculations never wait for a network request.
export const resolveDeviceLocationName = createLocationNameResolver(lookupDeviceLocationName);

export async function watchDeviceLocation(
  onLocation: (location: AppLocation) => void,
  onError: (error: unknown) => void
): Promise<Location.LocationSubscription> {
  await ensureForegroundLocationPermission(false);
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, distanceInterval: 1000, timeInterval: 60_000, mayShowUserSettingsDialog: false },
    (position) => onLocation(positionToLocation(position)),
    () => onError(new DeviceLocationError("unavailable", "Live location updates stopped. Use current location to try again.", true))
  );
}

export async function getLastKnownDeviceLocation(): Promise<AppLocation | null> {
  // The acquisition coordinator checks access once before cache/fresh lookup.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const position = await Promise.race([
    Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS, requiredAccuracy: 5000 }),
    new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 2000); })
  ]).finally(() => { if (timer) clearTimeout(timer); });
  return position ? positionToLocation(position, "cached") : null;
}

export async function getCurrentDeviceLocation(explicitRequest = false, signal?: AbortSignal): Promise<AppLocation> {
  try {
    const position = await waitForLocationFix<Location.LocationObject>((onFix, onError) => Location.watchPositionAsync({
      accuracy: explicitRequest ? Location.Accuracy.High : Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
      distanceInterval: 0,
      timeInterval: 1000
    }, onFix, (message) => onError(new DeviceLocationError("unavailable", `Your phone could not find your location. ${message}`, true))), explicitRequest ? 45_000 : 25_000, signal);
    return positionToLocation(position);
  } catch (error) {
    if (error instanceof DeviceLocationError) throw error;
    const issue = toLocationIssue(error);
    throw new DeviceLocationError(issue.code, issue.message, issue.canOpenSettings);
  }
}

export async function openLocationSettings(servicesDisabled = false): Promise<void> {
  if (Platform.OS === "web") return;
  if (Platform.OS === "android" && servicesDisabled) {
    await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
    return;
  }
  await Linking.openSettings();
}
