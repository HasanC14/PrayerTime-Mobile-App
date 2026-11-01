import { useEffect } from "react";
import { isHomeScreenWidgetAvailable } from "../services/homeScreenWidget";
import { syncHomeScreenWidget } from "../services/syncHomeScreenWidget";
import { buildHomeWidgetTimeline } from "../services/widgetTimeline";
import type { AppLocation, AppSettings, PrayerDay } from "../types";

export function useHomeScreenWidget({ calendar, location, settings, ready, foregroundRevision }: {
  calendar: PrayerDay[]; location: AppLocation | null; settings: AppSettings; ready: boolean; foregroundRevision: number;
}) {
  // References for location/settings change only on actual updates, never on countdown ticks.
  useEffect(() => {
    if (!ready || !isHomeScreenWidgetAvailable()) return;
    try {
      const entries = buildHomeWidgetTimeline(calendar, location, settings);
      void syncHomeScreenWidget(entries).catch(error => console.warn("Unable to update home screen widget", error));
    } catch (error) {
      console.warn("Unable to calculate home screen widget", error);
    }
  }, [calendar, foregroundRevision, location, ready, settings]);
}
