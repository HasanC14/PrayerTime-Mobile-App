import { requireOptionalNativeModule } from "expo";
import type { HomeWidgetKind, PrayerWidgetEntry } from "./widgetTimeline";

interface WidgetModule {
  updateTimeline: (json: string) => Promise<void>;
  requestPin: (kind: HomeWidgetKind) => Promise<boolean>;
}
const widget = requireOptionalNativeModule<WidgetModule>("PrayerTimeWidgets");
export function isHomeScreenWidgetAvailable(): boolean { return widget !== null; }
export async function publishWidgetTimeline(entries: PrayerWidgetEntry[]): Promise<void> {
  if (widget) await widget.updateTimeline(JSON.stringify(entries));
}
export async function requestHomeScreenWidget(kind: HomeWidgetKind): Promise<boolean> {
  return widget ? widget.requestPin(kind) : false;
}
