import type {AppSettings} from "../types";

// Notification toggles, journal settings and alarm lead times do not affect widgets.
export function widgetSettingsKey(settings: AppSettings): string {
  return JSON.stringify([settings.language, settings.timeFormat, settings.themeMode, settings.heroArtwork,
    settings.textScale, settings.ramadanMode, settings.hijriAdjustmentDays]);
}
