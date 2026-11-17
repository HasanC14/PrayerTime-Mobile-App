import {recordDiagnostic} from "../services/diagnostics";
import { useEffect } from "react";
import { isHomeScreenWidgetAvailable } from "../services/homeScreenWidget";
import { syncHomeScreenWidget } from "../services/syncHomeScreenWidget";
import { buildHomeWidgetTimeline } from "../services/widgetTimeline";
import { widgetSettingsKey } from "../services/widgetInputs";
import type { AppLocation, AppSettings, PrayerDay } from "../types";

export function useHomeScreenWidget({ calendar, location, settings, ready, foregroundRevision }: {
  calendar: PrayerDay[]; location: AppLocation | null; settings: AppSettings; ready: boolean; foregroundRevision: number;
}) {
  const settingsKey = widgetSettingsKey(settings);
  // Coalesce slider drags before doing the expensive formatting and native publish.
  useEffect(() => {
    if (!ready || !isHomeScreenWidgetAvailable()) return;
    const timer = setTimeout(() => {
    try {
      const entries = buildHomeWidgetTimeline(calendar, location, settings);
      void syncHomeScreenWidget(entries).then(() => recordDiagnostic("widgets", "success")).catch(() => recordDiagnostic("widgets", "failed"));
    } catch {
      recordDiagnostic("widgets", "failed");
    }
    }, 180);
    return () => clearTimeout(timer);
    // The calendar tracks calculation inputs; settingsKey tracks presentation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar, foregroundRevision, location, ready, settingsKey]);
}
