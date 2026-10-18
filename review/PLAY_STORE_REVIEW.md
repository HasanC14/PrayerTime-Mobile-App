# PrayerTime release review — 16 October 2026

**17 October update:** the project has since been upgraded to Expo SDK 57.0.30. See [SDK57_UPGRADE.md](SDK57_UPGRADE.md) for current dependency versions, validation, and Expo Go instructions. The audit counts and bundle measurements below describe the earlier SDK 54 review; the current audit reports 24 advisories with no critical advisories. The remaining publishing and native-device verification tasks still apply.

## Release decision

**Not ready to submit yet.** Functional fixes are implemented and the JavaScript checks pass, but a signed Android release has not been built or tested on a phone. The emulator could not start because this Mac had only about 254 MB free at the time of the attempt. No existing user files were removed; only this review's generated native directory and download cache were cleaned up.

This folder is not a Git repository, so changes are present directly in the workspace without a commit or branch.

## Work required before submission

| Priority | Finding | Next action |
| --- | --- | --- |
| Required | No published privacy-policy URL or developer privacy contact is configured. Location coordinates leave the device for LocationIQ reverse geocoding. | Complete `PRIVACY_POLICY_DRAFT.md`, publish it as a public HTML page, set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in the production build environment, and enter the same URL in Play Console. The app now includes a location/privacy explanation in Settings. |
| Required | No signed AAB or Play Console setup was available for review. | Connect the app to the intended Expo/EAS project, configure signing and production environment variables, and build the production profile in `eas.json`. Upload to internal testing first. |
| Required | Android GPS, sensors, reminder delivery, reboot recovery, and native layout remain unverified. | Test an installed release build on Android 13–16, including approximate location, revoked permissions, location services off, backgrounding, notification settings, Doze, and a reboot. |
| Required | City search depends on `EXPO_PUBLIC_LOCATIONIQ_API_KEY`. Local `.env` values do not establish that EAS production has the same configuration. | Configure a production LocationIQ key and quota. This public variable is embedded in the app; it is not a server secret. Review provider restrictions and terms. GPS calculations continue if city naming fails. |
| Review | Dependency audit still reports 38 advisories: 23 high and 15 moderate, no critical. These include build/development dependency chains. | Review their actual exposure before release. Compatible patches were applied; a forced Expo/React Native major upgrade was deliberately not applied as a routine security fix. |
| Reliability | At most 35 upcoming end-of-prayer reminders are prepared, across up to seven prayer-date groups. They stop after the prepared schedule if the app is not reopened. | The app now refreshes on foreground and explains the limit. For a stronger reminder promise, add and test native schedule replenishment; Android background work is not guaranteed to run at a particular time. |
| Reliability | Android may delay reminders without special Alarms & reminders access, even if notification permission is granted. | A settings shortcut and explanation were added. Test both permission states. There is no native exact-alarm permission status indicator yet. Current sounds are system notification sounds, not full Adhan playback or an alarm-clock experience. |
| Store setup | Store screenshots, feature graphic, content rating, audience declaration, Data safety form, and account-specific testing requirements are not completed in this workspace. | Complete these in the owner’s Play Console. Use installed-app screenshots for the store; review screenshots here are web previews. |

The installed React Native 0.81.5 Gradle version catalog specifies compile/target API **36**, matching Google's current new-app submission requirement. This was a configuration check, not verification of the manifest inside a signed AAB. Validate native-library page-size compatibility on the final artifact too.

For newer personal Play developer accounts, check whether the closed-test requirement applies: Google's guidance describes at least 12 continuously opted-in testers over 14 days before applying for production access. No access to this project's Play account was used.

The external support link remains unchanged. Google's tipping exception depends on the actual payment arrangement and whether payment unlocks digital benefits. Confirm the configured support flow qualifies before release.

## Fixes implemented

- Manual cities no longer get replaced by device location at startup. Fresh installations wait for the user to choose location access or manual setup.
- GPS coordinates and timezone are usable immediately; optional online city naming no longer delays prayer calculations. A delayed city lookup cannot replace a newer GPS fix or manual selection.
- Automatic location now watches movement while the app is active, using balanced accuracy, a 1 km movement threshold, a 60-second Android update interval, and a 15-minute freshness rule. Updates stop on backgrounding or manual selection. Approximate-location jitter is filtered.
- Nearby device readings reuse city names. GPS refresh no longer requests high accuracy unnecessarily for city-level prayer calculations.
- The location-services error opens Android's location settings; blocked app permission opens app settings.
- Invalid/low-accuracy compass readings clear the heading and alignment state instead of retaining a stale success state.
- Calendar prayer rows retain the selected date when the following day is included to compute Isha's end. Previously, tomorrow’s Fajr/Dhuhr/Asr/Maghrib could overwrite the selected day in the map.
- Reminder scheduling reconciles with the OS, preserves matching reminders, removes obsolete ones first, recovers orphaned reminders after an interrupted storage write, and reports cancellation failures. It no longer temporarily doubles all pending reminders during replacements.
- Reminders and notification permissions are rechecked on foreground. Invalid calculation results cancel outdated reminders. Superseded queued synchronization jobs are skipped.
- Added a white transparent Android notification icon, blocked unnecessary storage/overlay permissions, disabled Android automatic backup of local location/preferences, installed Expo's matching system UI module, and added preview APK / production AAB build profiles.
- Added in-app location/privacy information and an optional published-policy link. Clarified the disclosure of coordinates sent to LocationIQ and reminder limitations.
- Removed unused icon families from the bundle by importing Ionicons directly. On measured exports, Hermes bytecode decreased from **3.35 MB to 3.01 MB**, and the asset list decreased from 43 to 25 entries. This is not a measurement of signed APK/AAB download size.
- Applied compatible dependency patches: audit count fell from 50 (including one critical) to 38 (none critical).
- Removed the two-line clamp that clipped the onboarding headline at phone width.
- Made tab scene backgrounds opaque so inactive screens cannot show through the current screen. Enabled automatic native appearance so the System theme can follow the phone's setting.

## Design improvements to prioritize

1. **Make the current prayer and next prayer distinct.** The hero can say “Fajr ends in …” while only Dhuhr is highlighted in the table. Give the active prayer a “Now” state and the upcoming prayer a quieter “Next” label.
2. **Increase secondary text sizes.** Method/status labels are around 9–10 points and Hijri calendar dates are 8 points. Use larger text and test Android font scaling at 130–200%, especially the fixed-height calendar cells and prayer rows.
3. **Clarify reminder controls.** A volume icon suggests audio playback. A bell with a concise “30 min before end” explanation better describes the current feature. Offer start-of-prayer reminders separately before presenting the app as an Adhan app.
4. **Make start and end times easier to scan.** Use clearly labeled start/end columns or put the end time on a second line. Check narrow phones and large accessibility text rather than relying on one-line ranges.
5. **Improve trust and status feedback.** Show approximate vs precise location, saved/offline location, and the date through which reminders are scheduled. Avoid calling a stale fix “live”. Keep a visible manual-location option.
6. **Refine small-screen and large-screen layouts.** Preserve the existing purple identity, add adaptive launcher-icon safe margins, verify Android edge-to-edge insets and sheet keyboard behavior, and test tablet/foldable layouts.
7. **Keep informational guidance visually proportional.** The red “Prohibited time” hero is stronger than the more nuanced voluntary-prayer guidance below it. Review terminology, school-specific interpretation, and source references with a qualified reviewer.

## Features likely to help users

| Priority | Feature | Benefit / mobile capability |
| --- | --- | --- |
| 1 | Optional start-of-prayer reminders and selectable short Adhan sounds | Matches a common expectation; keep separate toggles for before-end reminders. Include a test-notification action. |
| 1 | Home-screen widget with next prayer and current city | Useful information without opening the app; schedule widget refreshes around prayer boundaries. |
| 1 | Local mosque minute adjustments and Hijri date adjustment | Helps users align calculated times and Ramadan dates with their community. Display adjustments explicitly. |
| 1 | Bengali localization and accessible text sizing | Supports likely local users and makes times/settings easier to read. |
| 2 | Offline city picker and saved Home/Work/Travel cities | Manual setup remains usable when LocationIQ is unavailable or unconfigured. |
| 2 | Travel-mode explanation and reliable schedule refresh | Recalculate on meaningful foreground movement; explain that background travel is not currently tracked. Add background location only if a concrete user need justifies its battery and permission costs. |
| 2 | Share a day's or Ramadan's timetable using the native share sheet | Helps families and communities coordinate without copying times manually. |
| 2 | Reminder-health view | Show notification access, exact-alarm guidance, the prepared schedule end, and a test action. Do not claim delivery is guaranteed under every manufacturer’s battery policy. |

## Verification and limits

- TypeScript: passed.
- ESLint: passed.
- Automated tests: **34 passed**, including location restoration/movement policy, calendar date selection, and reminder replacement/recovery failures.
- Expo Doctor: 18/18 checks passed after the fixes and dependency updates.
- Android Hermes production JavaScript export: passed; final measured bytecode is approximately 3.02 MB after the additional fixes.
- Expo Android config introspection: verified removal rules for storage/overlay permissions, backup disabled, location/notification permissions, and notification icon metadata. Introspection is not the fully merged signed-release manifest.
- Mobile-sized browser review: denied permission and manual fallback worked; manual city survived reload. Eleven flow checks passed with no uncaught exceptions, including setting persistence, calendar selection, alarm timing validation, privacy, manual Qibla, simulated GPS movement, and offline calculations. See `browser-checks.json`. Corrected tab backgrounds were visually rechecked in the saved screenshots.
- Native testing: blocked by insufficient disk space for the emulator. No signed AAB was built, no app was published, and no Play submission was made.

## References

- [Google Play target API requirement](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [Google Play user data/privacy policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
- [Google Play Data safety guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en)
- [Testing requirements for new personal accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Android 16 KB page-size compatibility](https://developer.android.com/guide/practices/page-sizes)
- [Google Play payments and tipping guidance](https://support.google.com/googleplay/android-developer/answer/10281818?hl=en)
- [Expo SDK 54 location API](https://docs.expo.dev/versions/v54.0.0/sdk/location/)
