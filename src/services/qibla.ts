import { Coordinates, Qibla } from "adhan";

import type { AppLocation } from "../types";

const KAABA = { lat: 21.4225, lng: 39.8262 };

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function normalizeSignedAngle(value: number): number {
  return ((value + 540) % 360) - 180;
}

export function getQiblaBearing(location: Pick<AppLocation, "lat" | "lng">): number | null {
  const distance = Math.hypot(location.lat - KAABA.lat, location.lng - KAABA.lng);
  if (distance < 0.0001) return null;
  return normalizeDegrees(Qibla(new Coordinates(location.lat, location.lng)));
}

export function getCompassDirection(bearing: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(normalizeDegrees(bearing) / 45) % directions.length];
}
