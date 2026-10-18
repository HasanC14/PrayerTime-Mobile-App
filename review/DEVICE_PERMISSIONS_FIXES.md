# Notification and location fixes — 17 October 2026

The reported test environment is Android Expo Go. No physical phone was connected during these checks, so the original native error and real reminder delivery have not been reproduced or verified.

## Changes

- Added an initial reminder setup sheet after choosing a location, a master reminder switch, permission status, phone settings shortcuts, and a five-second test reminder. The received message updates only when the app receives the native notification event.
- Android notification channels are prepared before requesting permission. Previously granted Expo Go access is reused; blocked app permissions and disabled channels direct users to settings. Android's `granted=true` plus `status=denied` combination no longer counts as allowed access.
- Exposed disabled notification sound and banners. Permission changes trigger reminder reconciliation, including when reminders were already enabled in the app. Individual prayer bells check phone access when enabling a reminder.
- Location permission is requested before checking phone services. An explicit location action can offer Android's location accuracy dialog; automatic refresh never opens that dialog. Declining optional network accuracy still allows GPS-only acquisition when location services remain enabled.
- Replaced the short first-fix request with a cancellable native position watch: up to 45 seconds for an explicit request, 25 seconds for automatic acquisition. The acquisition watch stops on completion, error, cancellation, or timeout. Continuing foreground updates use balanced accuracy and city-level movement thresholds, and stop when the app is inactive.
- Prayer calculations begin from coordinates without waiting for the city-name network lookup. Cached positions are labeled separately; restored snapshots remain cached until a new phone reading arrives. Manual Dhaka is explicitly labeled manual. Settings shows coordinates and reported accuracy, and acquisition progress and errors explain the next action.

## Validation

- Type checking and ESLint passed.
- 54 regression tests passed, including permission ordering, blocked permissions, notification channel state, GPS timeout cleanup, cancellation with a late subscription, stale fix rejection, and restoring cached coordinates.
- Expo Doctor passed 21/21 checks.
- Android production JavaScript export passed. This is not a compiled APK/AAB or a native device test.
- Ten checks passed in a 390×844 browser preview with no uncaught exceptions. They cover explicit manual Dhaka, synthetic London GPS, source/accuracy display, offline movement/calculations, denial recovery, and cached restoration. Evidence: [browser checks](device-permissions/browser-checks.json) and [screenshots](device-permissions/screenshots/).

## Check in Android Expo Go

1. Stop an older Expo server, run `npm start -- --clear`, and reopen the project in Expo Go.
2. In Settings, enable Prayer reminders. Android displays its permission request when permission is requestable. If Expo Go already has access, the status says Allowed and Android does not repeat the request. Blocked permission requires enabling notifications in Expo Go's phone settings. Android versions before 13 do not have the notification runtime permission dialog.
3. Tap Send test reminder. Wait at least five seconds and inspect the notification tray, banner, and sound. Phone channel settings and Do Not Disturb can affect presentation. Test background/locked-screen timing again in the installed PrayerTime build before release; Expo Go uses its own native configuration and permissions.
4. Turn on phone Location, then tap Use current phone location. Allow foreground location and, if offered, location accuracy. A successful new reading says Phone location fix and shows coordinates/accuracy. Cached phone fix means no new detection yet; Manual city means phone detection is off for the selection.
5. For acquisition problems, retry near a window or outdoors and follow the displayed permission/services error. A city name alone is not proof of a new GPS reading.

Local reminders remain available in Expo Go. Native exact-alarm access, Play Store signing/configuration, and device battery-management behavior need an installed build for final release validation.

References: [Expo SDK 57 notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [Expo SDK 57 location](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [Android notification runtime permission](https://developer.android.com/develop/ui/views/notifications/notification-permission).
