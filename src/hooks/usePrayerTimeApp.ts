import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Haptics from "expo-haptics";
import tzLookup from "tz-lookup";

import { DEFAULT_PRAYER_ALARMS, DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../constants/settings";
import {
  ensureForegroundLocationPermission,
  getCurrentDeviceLocation,
  getLastKnownDeviceLocation,
  openLocationSettings,
  resolveDeviceLocationName,
  toLocationIssue,
  watchDeviceLocation
} from "../services/location";
import { distanceInMeters, LOCATION_STALE_MS, shouldApplyDeviceUpdate, shouldRestoreDeviceLocation } from "../services/locationPolicy";
import { searchLocations } from "../services/locationIq";
import {
  cancelPrayerNotifications,
  getNotificationAccess,
  schedulePrayerNotifications
} from "../services/notifications";
import { calculatePrayerCalendar, getDateKeyInTimeZone } from "../services/prayerTimes";
import {
  loadPersistedState,
  mergeRecentLocations,
  saveLocation,
  saveRecentLocations,
  saveSettings
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

async function gentleHaptic(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics are optional on web and unsupported devices.
  }
}

export function usePrayerTimeApp() {
  const [booting, setBooting] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [location, setLocation] = useState<AppLocation | null>(null);
  const [recentLocations, setRecentLocations] = useState<AppLocation[]>([]);
  const [now, setNow] = useState(() => new Date());
  const [locating, setLocating] = useState(false);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const [notificationIssue, setNotificationIssue] = useState<string | null>(null);
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>({ status: "unknown", canAskAgain: true, channelBlocked: false, soundEnabled: true, bannersEnabled: true });
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [notificationSetupStep, setNotificationSetupStep] = useState<ReminderSetupStep>(null);
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState<boolean | null>(null);
  const [locationProgress, setLocationProgress] = useState<string | null>(null);
  const [calculationRevision, setCalculationRevision] = useState(0);
  const [foregroundRevision, setForegroundRevision] = useState(0);
  const [appActive, setAppActive] = useState(AppState.currentState === "active");

  const mountedRef = useRef(true);
  const bootedRef = useRef(false);
  const locationRef = useRef<AppLocation | null>(null);
  const deviceRefreshIdRef = useRef(0);
  const locationAbortRef = useRef<AbortController | null>(null);
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
      deviceRefreshIdRef.current += 1;
      locationAbortRef.current?.abort();
    };
  }, []);

  const applyLocation = useCallback(async (nextLocation: AppLocation) => {
    if (!mountedRef.current) return;
    setLocation(nextLocation);
    setLocationIssue(null);
    locationRef.current = nextLocation;
    setRecentLocations((current) => {
      const next = mergeRecentLocations(nextLocation, current);
      void saveRecentLocations(next).catch((error) => console.warn("Unable to save recent locations", error));
      return next;
    });
    await saveLocation(nextLocation).catch((error) => console.warn("Unable to save location", error));
  }, []);

  const applyDeviceLocation = useCallback(async (next: AppLocation) => {
    const previous = locationRef.current;
    const nearby = previous?.source === "device" && distanceInMeters(previous, next) < 1000;
    const immediate = nearby ? { ...next, name: previous.name, countryCode: previous.countryCode } : next;
    await applyLocation(immediate);
    void resolveDeviceLocationName(immediate).then((named) => {
      // A city lookup must never overwrite a newer GPS fix or manual selection.
      if (mountedRef.current && locationRef.current === immediate && named !== immediate) {
        void applyLocation(named);
      }
    });
  }, [applyLocation]);

  const refreshDeviceLocation = useCallback(
    async (requestPermission: boolean): Promise<boolean> => {
      const requestId = deviceRefreshIdRef.current + 1;
      locationAbortRef.current?.abort();
      const controller = new AbortController();
      locationAbortRef.current = controller;
      deviceRefreshIdRef.current = requestId;
      const isCurrentRequest = () => mountedRef.current && deviceRefreshIdRef.current === requestId;
      setLocating(true);
      setLocationIssue(null);
      setLocationProgress(requestPermission ? "Checking location permission and phone settings…" : "Refreshing phone location…");
      let quickLocationApplied = false;

      try {
        await ensureForegroundLocationPermission(requestPermission);
        if (!isCurrentRequest()) return false;
        setLocationProgress("Finding your current position…");

        try {
          const quickLocation = await getLastKnownDeviceLocation();
          if (quickLocation && isCurrentRequest()) {
            const currentLocation = locationRef.current;
            const shouldApplyQuickLocation =
              currentLocation?.source !== "device" || quickLocation.capturedAt >= currentLocation.capturedAt;
            if (shouldApplyQuickLocation) {
              await applyDeviceLocation(quickLocation);
              quickLocationApplied = true;
              if (isCurrentRequest()) setLocationProgress("Updating your location…");
            }
          }
        } catch {
          // A fresh fix below is still useful when no cached position exists.
        }

        try {
          if (!isCurrentRequest()) return false;
          const freshLocation = await getCurrentDeviceLocation(requestPermission, controller.signal);
          if (isCurrentRequest()) await applyDeviceLocation(freshLocation);
        } catch (error) {
          if (!quickLocationApplied) throw error;
          if (isCurrentRequest()) {
            setLocationIssue({
              code: "unavailable",
              message: "Your current location is unavailable. Prayer times use your saved location. Tap Use current phone location to try again.",
              canOpenSettings: true
            });
          }
        }

        if (isCurrentRequest()) await gentleHaptic();
        return true;
      } catch (error) {
        if (isCurrentRequest()) setLocationIssue(toLocationIssue(error));
        return false;
      } finally {
        if (isCurrentRequest()) {
          setLocating(false);
          setLocationProgress(null);
        }
      }
    },
    [applyDeviceLocation]
  );

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
        setRecentLocations(persisted.recentLocations);
        restoreDeviceLocation = shouldRestoreDeviceLocation(persisted.location);
      } catch (error) {
        console.warn("Unable to restore saved PrayerTime data", error);
      }

      if (active) {
        bootedRef.current = true;
        setBooting(false);
        if (restoreDeviceLocation) void refreshDeviceLocation(false);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, [refreshDeviceLocation]);

  useEffect(() => {
    if (booting) return;
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
  }, [booting, foregroundRevision, settings.language]);

  useEffect(() => {
    if (!bootedRef.current) return;
    void saveSettings(settings).catch((error) => console.warn("Unable to save settings", error));
  }, [settings]);

  useEffect(() => {
    let appState: AppStateStatus = AppState.currentState;
    const timer = setInterval(() => {
      if (appState === "active") setNow(new Date());
    }, 30_000);

    const subscription = AppState.addEventListener("change", (nextState) => {
      const returningToForeground = appState !== "active" && nextState === "active";
      appState = nextState;
      setAppActive(nextState === "active");
      if (!returningToForeground) return;

      setNow(new Date());
      setForegroundRevision((current) => current + 1);
      const currentLocation = locationRef.current;
      if (
        currentLocation?.source === "device" &&
        Date.now() - currentLocation.capturedAt > LOCATION_STALE_MS
      ) {
        void refreshDeviceLocation(false);
      }
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refreshDeviceLocation]);

  const locationSource = location?.source;
  useEffect(() => {
    if (booting || !appActive || locating || locationSource !== "device") return;
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
  }, [appActive, applyDeviceLocation, booting, locating, locationSource]);

  const dateKey = location ? getDateKeyInTimeZone(now, location.timeZone) : "";
  const calculationKey = `${dateKey}|${location?.lat}|${location?.lng}|${location?.timeZone}|${location?.countryCode}|${settings.method}|${settings.school}|${settings.midnightMode}|${settings.latitudeAdjustmentMethod}|${calculationRevision}`;

  const calculation = useMemo<{ calendar: PrayerDay[]; error: string | null }>(() => {
    if (!location) return { calendar: [], error: null };
    try {
      return {
        calendar: calculatePrayerCalendar(location, settings, now, 1, 8),
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
  const guidance = useMemo(() => getCurrentPrayerGuidance(now, today), [now, today]);

  useEffect(() => {
    if (booting) return;
    const shouldEnable = settings.notificationsEnabled && !calculation.error && calculation.calendar.length > 0;
    const revision = ++notificationRevisionRef.current;

    notificationQueueRef.current = notificationQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!mountedRef.current || revision !== notificationRevisionRef.current) return;
        try {
          if (shouldEnable) {
            const result = await schedulePrayerNotifications(
              calculation.calendar,
              settings.prayerAlarmMinutes ?? DEFAULT_PRAYER_ALARMS,
              false,
              exactAlarmAllowed,
              settings.language
            );
            if (revision !== notificationRevisionRef.current) return;
            if (!result.scheduled && result.reason === "permission" && mountedRef.current) {
              setNotificationIssue("Notifications are disabled in your phone settings.");
            } else if (mountedRef.current) {
              setNotificationIssue(null);
            }
          } else {
            await cancelPrayerNotifications();
            if (mountedRef.current) setNotificationIssue(null);
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
    calculation.calendar,
    calculation.error,
    settings.language,
    settings.notificationsEnabled,
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
    if (!settings.notificationsEnabled) setNotificationIssue(null);
  }, [settings.notificationsEnabled]);

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
      deviceRefreshIdRef.current += 1;
      locationAbortRef.current?.abort();
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

  const useRecentLocation = useCallback(
    async (value: AppLocation) => {
      deviceRefreshIdRef.current += 1;
      locationAbortRef.current?.abort();
      if (mountedRef.current) setLocating(false);
      await applyLocation({ ...value, source: "manual", capturedAt: Date.now() });
      await gentleHaptic();
    },
    [applyLocation]
  );

  const useDhakaTemporarily = useCallback(async () => {
    deviceRefreshIdRef.current += 1;
    locationAbortRef.current?.abort();
    if (mountedRef.current) setLocating(false);
    await applyLocation({ ...FALLBACK_LOCATION, capturedAt: Date.now() });
    await gentleHaptic();
  }, [applyLocation]);

  const searchLocationsForLanguage = useCallback((query: string) => searchLocations(query, settings.language), [settings.language]);

  return {
    booting,
    settings,
    location,
    recentLocations,
    now,
    locating,
    locationProgress,
    locationIssue,
    notificationIssue,
    notificationAccess,
    notificationBusy,
    notificationSetupStep,
    dismissNotificationSetup,
    setNotificationsEnabled,
    retryReminderSetup,
    openReminderTimingSettings,
    openNotificationSettings: openReminderNotificationSettings,
    calendar: calculation.calendar,
    calculationError: calculation.error,
    today,
    prayerState,
    guidance,
    refreshDeviceLocation,
    openLocationSettings: () => openLocationSettings(locationIssue?.code === "services-disabled" || locationIssue?.code === "settings-unsatisfied")
      .catch(() => setLocationIssue({ code: "unavailable", message: "Open your phone settings to manage location access.", canOpenSettings: false })),
    updateSetting,
    setAlarmLeadMinutes,
    togglePrayerAlarm,
    searchLocations: searchLocationsForLanguage,
    useManualLocation,
    useRecentLocation,
    useDhakaTemporarily,
    retryCalculation: () => {
      setCalculationRevision((current) => current + 1);
      setNow(new Date());
    }
  };
}
