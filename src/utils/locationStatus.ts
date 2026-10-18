import type { AppLocation } from "../types";

export function locationSourceLabel(location: AppLocation): string {
  if (location.source === "manual") return "Manual city · phone location off";
  return location.fixKind === "cached" ? "Cached phone fix" : "Phone location fix";
}

export function formatLocationAccuracy(accuracy?: number): string {
  if (accuracy === undefined || !Number.isFinite(accuracy)) return "Accuracy not reported";
  return accuracy >= 1000 ? `Approximate · ±${(accuracy / 1000).toFixed(1)} km` : `Accuracy ±${Math.max(1, Math.round(accuracy))} m`;
}
