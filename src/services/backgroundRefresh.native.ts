import {requireOptionalNativeModule} from "expo";
import {loadPersistedState} from "./storage";
import {calculatePrayerCalendar} from "./prayerTimes";
import {REMINDER_CALENDAR_DAYS} from "./reminderWindow";
import {schedulePrayerNotifications, cancelPrayerNotifications} from "./notifications";
import {getExactAlarmAccess} from "./reminderDeviceAccess";
import {buildHomeWidgetTimeline} from "./widgetTimeline";
import {syncHomeScreenWidget} from "./syncHomeScreenWidget";
import {recordDiagnostic} from "./diagnostics";
import {refreshSavedSchedule} from "./backgroundSchedule";

const NAME = "prayertime-schedule-refresh-v1";
// Conditional requires keep Expo Go and older installed binaries usable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const taskManager: typeof import("expo-task-manager") | null = requireOptionalNativeModule("ExpoTaskManager") ? require("expo-task-manager") : null;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const background: typeof import("expo-background-task") | null = requireOptionalNativeModule("ExpoBackgroundTask") ? require("expo-background-task") : null;
if (taskManager && background && !taskManager.isTaskDefined(NAME)) {
  taskManager.defineTask(NAME, async () => {
    const outcome = await refreshSavedSchedule({
      load: loadPersistedState,
      cancel: cancelPrayerNotifications,
      calendar: (location, settings, now) => calculatePrayerCalendar(location, settings, now, 1, REMINDER_CALENDAR_DAYS),
      schedule: async (calendar, settings, requestPermission) => schedulePrayerNotifications(calendar, settings, requestPermission,
        await getExactAlarmAccess().catch(() => null), settings.language),
      widgets: (calendar, location, settings, now) => syncHomeScreenWidget(buildHomeWidgetTimeline(calendar, location, settings, now)),
    });
    recordDiagnostic("background-refresh", outcome);
    return outcome === "success" ? background.BackgroundTaskResult.Success : background.BackgroundTaskResult.Failed;
  });
}
let queue: Promise<boolean> = Promise.resolve(false);
export function configureBackgroundRefresh(enabled: boolean): Promise<boolean> {
  queue = queue.catch(() => false).then(async () => {
    if (!taskManager || !background || !await taskManager.isAvailableAsync()) return false;
    const registered = await taskManager.isTaskRegisteredAsync(NAME);
    if (!enabled) {
      if (registered) await background.unregisterTaskAsync(NAME);
      return false;
    }
    if (await background.getStatusAsync() !== background.BackgroundTaskStatus.Available) return false;
    if (!registered) await background.registerTaskAsync(NAME, {minimumInterval: 12 * 60});
    return true;
  });
  return queue;
}
