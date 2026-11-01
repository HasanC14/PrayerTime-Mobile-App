import { requireOptionalNativeModule } from "expo";
import type { HomeWidgetKind, PrayerWidgetEntry } from "./widgetTimeline";

export function isHomeScreenWidgetAvailable(): boolean {
  return requireOptionalNativeModule("ExpoWidgets") !== null;
}
export async function publishWidgetTimeline(entries: PrayerWidgetEntry[]): Promise<void> {
  // Lazy import lets Expo Go and older binaries still open the app safely.
  if (!isHomeScreenWidgetAvailable()) return;
  const { default: widget } = await import("../widgets/NextPrayerWidget");
  const { prepareWidgetArtwork } = await import("./widgetArtwork.ios");
  // Decorative assets must not hold up offline timeline updates or the Add action.
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let artworkUri: string | undefined;
  try {
    artworkUri = await Promise.race([
      prepareWidgetArtwork(entries[0].props.artwork),
      new Promise<undefined>(resolve => { timeout = setTimeout(() => resolve(undefined), 3000); })
    ]);
  } finally { if (timeout) clearTimeout(timeout); }
  const timeline = entries.map(entry => ({ date: new Date(entry.timestamp), props: { ...entry.props, artworkUri } }));
  widget.updateTimeline(timeline);
  const { daySummaryWidget, prayerTimesWidget } = await import("../widgets/DetailWidgets");
  daySummaryWidget.updateTimeline(timeline);
  prayerTimesWidget.updateTimeline(timeline);
  const { default: heroWidget } = await import("../widgets/HeroWidget");
  heroWidget.updateTimeline(timeline);
}
// iOS requires adding a widget from the system widget gallery.
export async function requestHomeScreenWidget(_kind: HomeWidgetKind): Promise<boolean> { return false; }
