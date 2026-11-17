import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {configureBackgroundRefresh} from "../services/backgroundRefresh";
import type {NotificationCoverage} from "../services/notificationCoverage";
import {recordDiagnostic} from "../services/diagnostics";
import { useSavedValue } from "./useSavedValue";
import { AppState, type AppStateStatus } from "react-native";
import * as Haptics from "expo-haptics";
import tzLookup from "tz-lookup";

import { DEFAULT_SETTINGS } from "../constants/settings";
import {
  ensureForegroundLocationPermission,
  getCurrentDeviceLocation,
  getLastKnownDeviceLocation,
  openLocationSettings,
  resolveDeviceLocationName,
  toLocationIssue,
  watchDeviceLocation
} from "../services/location";
import { distanceInMeters, hasLocationName, LOCATION_STALE_MS, shouldApplyDeviceUpdate, shouldRestoreDeviceLocation } from "../services/locationPolicy";
import { LOCATION_NAME_RETRY_MS, mergeDeviceLocationName } from "../services/deviceLocationName";
import { createDeviceLocationRefresh } from "../services/deviceLocationRefresh";
import { searchLocations } from "../services/locationIq";
import {
  cancelPrayerNotifications,
  getNotificationAccess,
  schedulePrayerNotifications, readNotificationCoverage
} from "../services/notifications";
import { calculatePrayerCalendar, getDateKeyInTimeZone } from "../services/prayerTimes";
import { REMINDER_CALENDAR_DAYS } from "../services/reminderWindow";
import {
  loadPersistedState,
  clearRecentLocationHistory,
  saveLocation,
  saveSettings, recoverDamagedPreferences
} from "../services/storage";
import { notificationAccessMessage } from "../services/notificationAccess";
import { getExactAlarmAccess, openExactAlarmSettings, openNotificationSettings } from "../services/reminderDeviceAccess";
import { enableReminderSelection, reminderSetupStep, type ReminderSelection, type ReminderSetupStep } from "../services/reminderSetup";
import { PRAYER_NAMES } from "../types";
import type {
  AppLocation,
  AppSettings,
  LocationIssue,
  LocationSearchResult,
  PrayerDay,
  PrayerName,
  NotificationAccess
} from "../types";
import { getCurrentPrayerGuidance, getPrayerState } from "../utils/time";
import { prayerClockDelay } from "../services/prayerClock";
import { useHomeScreenWidget } from "./useHomeScreenWidget";
import { usePrayerJournal } from "./usePrayerJournal";
import { getJournalDateKey } from "../services/journalOverview";

async function gentleHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are optional on web and unsupported devices.
  }
}

export function usePrayerTimeApp() {
  const [booting, setBooting] = useState(true);
  const [restoreIssue, setRestoreIssue] = useState(false);
  const [restoreRevision, setRestoreRevision] = useState(0);
  const [saveRevision, setSaveRevision] = useState(0);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [locating, setLocating] = useState(false);
  const [deviceLookupBusy, setDeviceLookupBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const [notificationCoverage, setNotificationCoverage] = useState<NotificationCoverage | null>(null);
  const [notificationIssue, setNotificationIssue] = useState<string | null>(null);
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>({ status: "unknown", canAskAgain: true, channelBlocked: false, soundEnabled: true, bannersEnabled: true });
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationSetupStep, setNotificationSetupStep] = useState<ReminderSetupStep>(null);
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState<boolean | null>(null);
  const [locationProgress, setLocationProgress] = useState<string | null>(null);
  const [calculationRevision, setCalculationRevision] = useState(0);
  const [foregroundRevision, setForegroundRevision] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");

  const mountedRef = useRef(true);
  const locationRef = useRef<AppLocation | null>(null);
  const deviceRefreshRef = useRef<ReturnType<typeof createDeviceLocationRefresh> | null>(null);
  const homeRefreshRef = useRef<Promise<void> | null>(null);
  const refreshFrameRef = useRef<number | null>(null);
  const finishHomeRefreshRef = useRef<(() => void) | null>(null);
  const notificationRequestRef = useRef<Promise<boolean> | null>(null);
  const pendingReminderRef = useRef<ReminderSelection | null>(null);
  const reminderEnableRef = useRef<Promise<boolean> | null>(null);
  const reminderFlowRevisionRef = useRef(0);
  const notificationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const notificationRevisionRef = useRef(0);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      deviceRefreshRef.current?.cancel();
      if (refreshFrameRef.current !== null) cancelAnimationFrame(refreshFrameRef.current);
      finishHomeRefreshRef.current?.();
      refreshFrameRef.current = null;
      finishHomeRefreshRef.current = null;
      homeRefreshRef.current = null;
    };
  }, []);

  const applyLocation = useCallback(async (nextLocation: AppLocation) => {
    if (!mountedRef.current) return;
    setLocation(nextLocation);
    setLocationIssue(null);
    locationRef.current = nextLocation;
  }, []);

  const refreshLocationName = useCallback(async (target: AppLocation, retryNow = false) => {
    if (target.source !== "device" || hasLocationName(target)) return;
    const named = await resolveDeviceLocationName(target, { retryNow });
    if (!mountedRef.current) return;
    const current = locationRef.current;
    const merged = mergeDeviceLocationName(current, target, named);
    if (merged && merged !== current) await applyLocation(merged);
  }, [applyLocation]);

  const applyDeviceLocation = useCallback(async (next: AppLocation, retryName = false) => {
    const previous = locationRef.current;
    const nearby = previous?.source === "device" && previous.timeZone === next.timeZone && distanceInMeters(previous, next) < 1000;
    const immediate = nearby ? { ...next, name: previous.name, countryCode: previous.countryCode } : next;
    await applyLocation(immediate);
    void refreshLocationName(immediate, retryName);
  }, [applyLocation, refreshLocationName]);

  useEffect(() => {
    const service = createDeviceLocationRefresh({
      ensureAccess: ensureForegroundLocationPermission,
      cached: getLastKnownDeviceLocation,
      fresh: getCurrentDeviceLocation,
      current: () => locationRef.current,
      apply: applyDeviceLocation,
      busy: (pending, explicit) => {
        if (!mountedRef.current) return;
        setDeviceLookupBusy(pending);
        setLocating(pending && explicit);
      },
      progress: value => { if (mountedRef.current) setLocationProgress(value); },
      issue: error => { if (mountedRef.current) setLocationIssue(toLocationIssue(error)); },
    });
    deviceRefreshRef.current = service;
    return () => { service.cancel(); deviceRefreshRef.current = null; };
  }, [applyDeviceLocation]);

  const refreshDeviceLocation = useCallback((requestPermission: boolean) => {
    if (requestPermission) setLocationIssue(null);
    return deviceRefreshRef.current?.refresh(requestPermission) ?? Promise.resolve(false);
  }, []);

  const refreshHome = useCallback((): Promise<void> => {
    if (homeRefreshRef.current) return homeRefreshRef.current;
    setRefreshing(true);
    setNow(new Date());
    setCalculationRevision(current => current + 1);
    setForegroundRevision(current => current + 1);
    if (locationRef.current?.source === "device") void refreshDeviceLocation(false);
    // Finish after the local calculation can render; GPS, geocoding, storage,
    // reminder delivery and widget publishing never hold the swipe spinner.
    const task = new Promise<void>(resolve => {
      finishHomeRefreshRef.current = resolve;
      refreshFrameRef.current = requestAnimationFrame(() => {
        refreshFrameRef.current = null;
        if (mountedRef.current) setRefreshing(false);
        homeRefreshRef.current = null;
        finishHomeRefreshRef.current = null;
        resolve();
      });
    });
    homeRefreshRef.current = task;
    return task;
  }, [refreshDeviceLocation]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      let restoreDeviceLocation = false;
      try {
        const persisted = await loadPersistedState();
        if (!active) return;
        setSettings(persisted.settings);
        setLocation(persisted.location);
        locationRef.current = persisted.location;
        setRestoreIssue(false);
        void readNotificationCoverage().then(value => {if (active) setNotificationCoverage(value);});
        void clearRecentLocationHistory();
        restoreDeviceLocation = shouldRestoreDeviceLocation(persisted.location);
      } catch (error) {
        console.warn("Unable to restore saved PrayerTime data", error);
        if (active) setRestoreIssue(true);
      }

      if (active) {
        setBooting(false);
        if (restoreDeviceLocation) void refreshDeviceLocation(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [refreshDeviceLocation, restoreRevision]);

  useEffect(() => {
    if (booting || restoreIssue) return;
    let active = true;
    void Promise.all([getNotificationAccess(false, settings.language), getExactAlarmAccess().catch(() => null)]).then(([access, exact]) => {
      if (!active) return;
      setNotificationAccess(access);
      setExactAlarmAllowed(exact);
      const selection = pendingReminderRef.current;
      if (selection && access.status === "granted" && !access.channelBlocked && !reminderEnableRef.current) {
        pendingReminderRef.current = null;
        setSettings(current => enableReminderSelection(current, selection));
        setNotificationIssue(notificationAccessMessage(access));
        setNotificationSetupStep(reminderSetupStep(access, exact));
      } else if (exact === true) {
        setNotificationSetupStep(current => current === "timing" ? null : current);
      }
    }).catch(() => {
      if (active) setNotificationIssue("Could not check reminder access. Turn on Prayer reminders to try again.");
    });
    return () => { active = false; };
  }, [booting, foregroundRevision, restoreIssue, settings.language]);

  useEffect(() => {
    if (booting || restoreIssue) return;
    void configureBackgroundRefresh(settings.notificationsEnabled || settings.prayerStartNotificationsEnabled)
      .catch(() => recordDiagnostic("background-refresh", "unavailable"));
  }, [booting, restoreIssue, settings.notificationsEnabled, settings.prayerStartNotificationsEnabled, foregroundRevision]);

  const persistenceReady = !booting && !restoreIssue;
  const settingsSaveIssue = useSavedValue(settings, saveSettings, persistenceReady, saveRevision);
  const locationSaveIssue = useSavedValue(location, saveLocation, persistenceReady, saveRevision);

  useEffect(() => {
    let appState: AppStateStatus = AppState.currentState;

    const subscription = AppState.addEventListener("change", (nextState) => {
      const returningToForeground = appState !== "active" && nextState === "active";
      appState = nextState;
      setAppActive(nextState === "active");
      if (!returningToForeground) return;

      setNow(new Date());
      setForegroundRevision((current) => current + 1);
      const currentLocation = locationRef.current;
      if (currentLocation?.source === "device") void refreshLocationName(currentLocation, true);
      if (
        currentLocation?.source === "device" &&
        Date.now() - currentLocation.capturedAt > LOCATION_STALE_MS
      ) {
        void refreshDeviceLocation(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshDeviceLocation, refreshLocationName]);

  // Naming retries independently of GPS movement, including on a stationary phone.
  useEffect(() => {
    if (booting || restoreIssue || !appActive || !location || location.source !== "device" || hasLocationName(location)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const retry = async () => {
      await refreshLocationName(location);
      if (!cancelled) timer = setTimeout(() => { void retry(); }, LOCATION_NAME_RETRY_MS);
    };
    void retry();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [appActive, booting, location, refreshLocationName, restoreIssue]);

  const locationSource = location?.source;
  useEffect(() => {
    if (booting || restoreIssue || !appActive || deviceLookupBusy || locationSource !== "device") return;
    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    void watchDeviceLocation((next) => {
      if (cancelled || locationRef.current?.source !== "device") return;
      if (shouldApplyDeviceUpdate(locationRef.current, next)) void applyDeviceLocation(next);
    }, (error) => {
      if (!cancelled) setLocationIssue(toLocationIssue(error));
    }).then((watcher) => {
      if (cancelled) watcher.remove();
      else subscription = watcher;
    }).catch((error) => {
      if (!cancelled) setLocationIssue(toLocationIssue(error));
    });
    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [appActive, applyDeviceLocation, booting, deviceLookupBusy, locationSource, restoreIssue]);

  const dateKey = location ? getDateKeyInTimeZone(now, location.timeZone) : "";
  const calculationKey = `${dateKey}|${location?.lat}|${location?.lng}|${location?.timeZone}|${location?.countryCode}|${settings.method}|${settings.school}|${settings.midnightMode}|${settings.hijriAdjustmentDays}|${settings.latitudeAdjustmentMethod}|${calculationRevision}`;

  const calculation = useMemo<{ calendar: PrayerDay[]; error: string | null }>(() => {
    if (!location) return { calendar: [], error: null };
    try {
      return {
        calendar: calculatePrayerCalendar(location, settings, now, 1, REMINDER_CALENDAR_DAYS),
        error: null
      };
    } catch (error) {
      return {
        calendar: [],
        error: error instanceof Error ? error.message : "Prayer times could not be calculated."
      };
    }
    // calculationKey deliberately limits recalculation to date/location/calculation changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculationKey]);

  const today = useMemo(
    () => calculation.calendar.find((day) => day.dateKey === dateKey),
    [calculation.calendar, dateKey]
  );
  const prayerState = useMemo(() => getPrayerState(now, calculation.calendar), [now, calculation.calendar]);
  const journal = usePrayerJournal(settings.prayerTrackingEnabled,
    location ? getJournalDateKey(now, calculation.calendar, location.timeZone) : null);
  const guidance = useMemo(() => getCurrentPrayerGuidance(now, today), [now, today]);

  useEffect(() => {
    if (booting || restoreIssue || !appActive) return;
    const timer = setTimeout(() => setNow(new Date()), prayerClockDelay(now, calculation.calendar));
    return () => clearTimeout(timer);
  }, [appActive, booting, calculation.calendar, now, restoreIssue]);
  useHomeScreenWidget({ calendar: calculation.calendar, location, settings, ready: !booting && !restoreIssue, foregroundRevision });

  useEffect(() => {
    if (booting || restoreIssue) return;
    const anyNotificationsEnabled = settings.notificationsEnabled || settings.prayerStartNotificationsEnabled;
    const shouldEnable = anyNotificationsEnabled && !calculation.error && calculation.calendar.length > 0;
    const revision = ++notificationRevisionRef.current;

    notificationQueueRef.current = notificationQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!mountedRef.current || revision !== notificationRevisionRef.current) return;
        try {
          if (shouldEnable) {
            const result = await schedulePrayerNotifications(
              calculation.calendar,
              {notificationsEnabled: settings.notificationsEnabled,
                prayerStartNotificationsEnabled: settings.prayerStartNotificationsEnabled,
                prayerAlarmMinutes: settings.prayerAlarmMinutes},
              false,
              exactAlarmAllowed,
              settings.language
            );
            if (revision !== notificationRevisionRef.current) return;
            if (mountedRef.current && result.coverage) setNotificationCoverage(result.coverage);
            if (!result.scheduled && result.reason === "permission" && mountedRef.current) {
              setNotificationIssue("Notifications are disabled in your phone settings.");
            } else if (mountedRef.current) {
              setNotificationIssue(null);
            }
          } else if (!anyNotificationsEnabled) {
            await cancelPrayerNotifications();
            if (mountedRef.current) setNotificationCoverage(null);
            if (mountedRef.current) setNotificationIssue(null);
          } else if (mountedRef.current && revision === notificationRevisionRef.current) {
            setNotificationIssue("Prayer reminders couldn't be refreshed. Previously scheduled reminders are unchanged.");
          }
        } catch (error) {
          console.warn("Unable to sync prayer alarms", error);
          if (mountedRef.current && revision === notificationRevisionRef.current) {
            setNotificationIssue("Prayer alarms could not be scheduled. Please try again.");
          }
        }
      });
  }, [
    booting,
    restoreIssue,
    calculation.calendar,
    calculation.error,
    settings.language,
    settings.notificationsEnabled,
    settings.prayerStartNotificationsEnabled,
    settings.prayerAlarmMinutes,
    notificationAccess.status,
    notificationAccess.channelBlocked,
    exactAlarmAllowed,
    foregroundRevision
  ]);

  const updateSetting = useCallback(<Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    void gentleHaptic();
  }, []);

  const dismissNotificationSetup = useCallback(() => {
    pendingReminderRef.current = null;
    reminderFlowRevisionRef.current += 1;
    setNotificationSetupStep(null);
    if (!settings.notificationsEnabled && !settings.prayerStartNotificationsEnabled) setNotificationIssue(null);
  }, [settings.notificationsEnabled, settings.prayerStartNotificationsEnabled]);

  const requestNotificationAccess = useCallback((): Promise<boolean> => {
    if (notificationRequestRef.current) return notificationRequestRef.current;
    setNotificationBusy(true);
    setNotificationIssue(null);
    const run = async () => {
      try {
        const access = await getNotificationAccess(true, settings.language);
        if (!mountedRef.current) return false;
        setNotificationAccess(access);
        const granted = access.status === "granted" && !access.channelBlocked;
        setNotificationIssue(notificationAccessMessage(access));
        if (!granted && pendingReminderRef.current) setNotificationSetupStep("notifications");
        return granted;
      } catch (error) {
        console.warn("Unable to request notification permission", error);
        if (mountedRef.current) {
          setNotificationIssue("Your phone could not open notification access. Please try again or open phone settings.");
          if (pendingReminderRef.current) setNotificationSetupStep("notifications");
        }
        return false;
      } finally {
        notificationRequestRef.current = null;
        if (mountedRef.current) setNotificationBusy(false);
      }
    };
    notificationRequestRef.current = run();
    return notificationRequestRef.current;
  }, [settings.language]);

  const enableReminders = useCallback((selection: ReminderSelection): Promise<boolean> => {
    if (reminderEnableRef.current) return reminderEnableRef.current;
    pendingReminderRef.current = selection;
    const revision = ++reminderFlowRevisionRef.current;
    const run = async () => {
      try {
        if (!(await requestNotificationAccess())) return false;
        if (!mountedRef.current || revision !== reminderFlowRevisionRef.current || !pendingReminderRef.current) return false;
        pendingReminderRef.current = null;
        setSettings(current => enableReminderSelection(current, selection));
        let exact: boolean | null = null;
        try { exact = await getExactAlarmAccess(); }
        catch (error) { console.warn("Unable to inspect on-time reminder access", error); }
        if (mountedRef.current && revision === reminderFlowRevisionRef.current) {
          setExactAlarmAllowed(exact);
          setNotificationSetupStep(exact === false ? "timing" : null);
        }
        return true;
      } finally {
        reminderEnableRef.current = null;
      }
    };
    reminderEnableRef.current = run();
    return reminderEnableRef.current;
  }, [requestNotificationAccess]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) return enableReminders("all");
    dismissNotificationSetup();
    setSettings(current => ({ ...current, notificationsEnabled: false }));
    return true;
  }, [dismissNotificationSetup, enableReminders]);

  const setPrayerStartNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (enabled) return enableReminders("starts");
    dismissNotificationSetup();
    setSettings(current => ({ ...current, prayerStartNotificationsEnabled: false }));
    return true;
  }, [dismissNotificationSetup, enableReminders]);

  const retryReminderSetup = useCallback(() => enableReminders(pendingReminderRef.current ?? "all"), [enableReminders]);

  const openReminderTimingSettings = useCallback(async () => {
    setNotificationIssue(null);
    try { await openExactAlarmSettings(); }
    catch (error) {
      if (mountedRef.current) setNotificationIssue(error instanceof Error ? error.message : "Open your phone settings to allow on-time reminders.");
    }
  }, []);

  const openReminderNotificationSettings = useCallback(async () => {
    try { await openNotificationSettings(notificationAccess.channelBlocked); }
    catch { if (mountedRef.current) setNotificationIssue("Open your phone’s app notification settings to enable reminders."); }
  }, [notificationAccess.channelBlocked]);

  const setAlarmLeadMinutes = useCallback(async (minutes: number): Promise<void> => {
    const normalizedMinutes = Math.max(1, Math.min(60, Math.round(minutes)));
    setSettings((current) => ({
      ...current,
      alarmLeadMinutes: normalizedMinutes,
      prayerAlarmMinutes: Object.fromEntries(
        PRAYER_NAMES.map((prayer) => [
          prayer,
          current.prayerAlarmMinutes[prayer] === null ? null : normalizedMinutes
        ])
      ) as AppSettings["prayerAlarmMinutes"]
    }));
    await gentleHaptic();
  }, []);

  const togglePrayerAlarm = useCallback(
    async (prayer: PrayerName): Promise<boolean> => {
      const isActive =
        settings.notificationsEnabled && settings.prayerAlarmMinutes[prayer] !== null;

      if (isActive) {
        setSettings((current) => {
          const prayerAlarmMinutes = { ...current.prayerAlarmMinutes, [prayer]: null };
          const hasAnotherActiveAlarm = PRAYER_NAMES.some(
            (name) => prayerAlarmMinutes[name] !== null
          );
          return {
            ...current,
            notificationsEnabled: hasAnotherActiveAlarm && current.notificationsEnabled,
            prayerAlarmMinutes
          };
        });
        await gentleHaptic();
        return true;
      }

      if (!(await enableReminders(prayer))) return false;

      await gentleHaptic();
      return true;
    },
    [enableReminders, settings.notificationsEnabled, settings.prayerAlarmMinutes]
  );

  const useManualLocation = useCallback(
    async (value: LocationSearchResult) => {
      deviceRefreshRef.current?.cancel();
      if (mountedRef.current) setLocating(false);
      let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      try {
        timeZone = tzLookup(value.lat, value.lng);
      } catch {
        // Device timezone is a safe final fallback for unusual coordinates.
      }
      await applyLocation({
        name: value.name.trim() || "Custom location",
        lat: value.lat,
        lng: value.lng,
        source: "manual",
        countryCode: value.countryCode,
        timeZone,
        capturedAt: Date.now()
      });
      await gentleHaptic();
    },
    [applyLocation]
  );

  const searchLocationsForLanguage = useCallback((query: string) => searchLocations(query, settings.language), [settings.language]);

  return {
    booting,
    restoreIssue,
    retryRestore: () => { setBooting(true); setRestoreRevision(current => current + 1); },
    storageIssue: settingsSaveIssue || locationSaveIssue,
    retrySaving: () => setSaveRevision(current => current + 1),
    settings,
    journal,
    location,
    now,
    locating,
    locationProgress,
    locationIssue,
    notificationIssue,
    notificationCoverage,
    notificationAccess,
    notificationBusy,
    notificationSetupStep,
    dismissNotificationSetup,
    setNotificationsEnabled,
    setPrayerStartNotificationsEnabled,
    exactAlarmAllowed,
    retryReminderSetup,
    openReminderTimingSettings,
    openNotificationSettings: openReminderNotificationSettings,
    calendar: calculation.calendar,
    calculationError: calculation.error,
    today,
    prayerState,
    guidance,
    refreshDeviceLocation,
    refreshHome,
    refreshing,
    openLocationSettings: () => openLocationSettings(locationIssue?.code === "services-disabled" || locationIssue?.code === "settings-unsatisfied")
      .catch(() => setLocationIssue({ code: "unavailable", message: "Open your phone settings to manage location access.", canOpenSettings: false })),
    updateSetting,
    setAlarmLeadMinutes,
    togglePrayerAlarm,
    searchLocations: searchLocationsForLanguage,
    useManualLocation,
    recoverSavedData: async () => {
      await recoverDamagedPreferences();
      setBooting(true); setRestoreRevision(value => value + 1);
    },
    retryCalculation: () => {
      setCalculationRevision((current) => current + 1);
      setNow(new Date());
    }
  };
}
