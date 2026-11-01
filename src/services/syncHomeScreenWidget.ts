import { publishWidgetTimeline } from "./homeScreenWidget";
import { createWidgetPublisher } from "./widgetPublisher";

export const syncHomeScreenWidget = createWidgetPublisher(publishWidgetTimeline);
