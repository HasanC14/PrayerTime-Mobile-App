import type { HomeWidgetKind, PrayerWidgetEntry } from "./widgetTimeline";

// Web and unsupported platforms: keep the Settings preview available.
export function isHomeScreenWidgetAvailable(): boolean { return false; }
export async function publishWidgetTimeline(_entries: PrayerWidgetEntry[]): Promise<void> {}
export async function requestHomeScreenWidget(_kind: HomeWidgetKind): Promise<boolean> { return false; }
