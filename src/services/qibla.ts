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

// Every compass element uses the same phone-relative frame. In north-up mode
// heading is absent; live headings rotate both the rose and the Qibla arrow.
export function getCompassPresentation(bearing: number | null, heading: number | null) {
  const phoneHeading = heading !== null && Number.isFinite(heading) ? normalizeDegrees(heading) : 0;
  return {
    needleRotation: bearing === null ? 0 : normalizeSignedAngle(bearing - phoneHeading),
    markers: (["N", "E", "S", "W"] as const).map((direction, index) => {
      const angle = normalizeSignedAngle(index * 90 - phoneHeading);
      const radians = angle * Math.PI / 180;
      return { direction, angle, x: Math.sin(radians), y: -Math.cos(radians) };
    })
  };
}
