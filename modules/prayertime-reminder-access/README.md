# Reminder access

An Android-only Expo module used by the Prayer reminders toggle and Home prayer bells. It inspects `AlarmManager.canScheduleExactAlarms()` on Android 12+ and treats older Android versions as not needing this extra permission. Inspection never opens a system screen.

The explicit Allow on-time reminders action opens `ACTION_REQUEST_SCHEDULE_EXACT_ALARM` for PrayerTime's package. Notification troubleshooting opens the app's notification settings or its Prayer times notification channel. JavaScript reads both permissions again when the application returns to the foreground.

The module is autolinked from `modules/` through the app's package configuration. A new native APK is required. Expo Go and existing APKs do not include this module; the JavaScript adapter handles its absence without crashing or inventing a permission result.

Autolinking resolves `com.hubxpert.prayertime.reminders.PrayerReminderAccessModule`. Changes to this module require a new native build; verify permission-screen behavior on a physical Android device.

References: [Android exact alarm access](https://developer.android.com/develop/background-work/services/alarms#using-schedule-exact-alarm), [Expo local module autolinking](https://docs.expo.dev/modules/autolinking/).
