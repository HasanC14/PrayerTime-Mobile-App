import { Linking, Platform } from "react-native";
import * as Location from "expo-location";
import tzLookup from "tz-lookup";

import { reverseGeocodeLocation } from "./locationIq";
import { distanceInMeters } from "./locationPolicy";
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

let namedLocation: AppLocation | null = null;

// Naming is optional: GPS and offline prayer calculations never wait for a network request.
export async function resolveDeviceLocationName(location: AppLocation): Promise<AppLocation> {
  if (namedLocation && distanceInMeters(namedLocation, location) < 1000) {
    return { ...location, name: namedLocation.name, countryCode: namedLocation.countryCode };
  }
  try {
    const place = await reverseGeocodeLocation(location.lat, location.lng);
    namedLocation = { ...location, ...place };
    return namedLocation;
  } catch {
    return location;
  }
}

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
  await ensureForegroundLocationPermission(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const position = await Promise.race([
    Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS, requiredAccuracy: 5000 }),
    new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 2000); })
  ]).finally(() => { if (timer) clearTimeout(timer); });
  return position ? positionToLocation(position, "cached") : null;
}

export async function getCurrentDeviceLocation(explicitRequest = false, signal?: AbortSignal): Promise<AppLocation> {
  await ensureForegroundLocationPermission(false);
  try {
    const position = await waitForLocationFix<Location.LocationObject>((onFix, onError) => Location.watchPositionAsync({
      accuracy: explicitRequest ? Location.Accuracy.High : Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: false,
      distanceInterval: 0,
      timeInterval: 1000
    }, onFix, (message) => onError(new DeviceLocationError("unavailable", `Your phone could not return a location fix. ${message}`, true))), explicitRequest ? 45_000 : 25_000, signal);
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
