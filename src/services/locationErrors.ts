import type { LocationErrorCode, LocationIssue } from "../types";

export class DeviceLocationError extends Error {
  constructor(public code: LocationErrorCode, message: string, public canOpenSettings = false) {
    super(message);
    this.name = "DeviceLocationError";
  }
}

export function toLocationIssue(error: unknown): LocationIssue {
  if (error instanceof DeviceLocationError) {
    return { code: error.code, message: error.message, canOpenSettings: error.canOpenSettings };
  }
  const nativeCode = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (/SETTINGS_UNSATISFIED/.test(nativeCode)) {
    return { code: "settings-unsatisfied", message: "Your phone could not enable location accuracy. Turn on Location and Google Location Accuracy in phone settings, then try again.", canOpenSettings: true };
  }
  if (/UNAUTHORIZED|PERMISSION/.test(nativeCode)) {
    return { code: "permission-blocked", message: "Location access is not allowed. Open phone settings and allow location while using the app.", canOpenSettings: true };
  }
  if (/UNAVAILABLE|UNKNOWN|TIMEOUT|CANCELLED/.test(nativeCode)) {
    return { code: "unavailable", message: "Your phone has not returned a location fix. Turn on Location, move near a window or outdoors, and try again.", canOpenSettings: true };
  }
  return { code: "unavailable", message: "Your phone could not provide a location. Check Location permissions and Location Accuracy in phone settings, then try again.", canOpenSettings: true };
}
