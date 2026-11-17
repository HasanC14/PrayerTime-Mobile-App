# Architecture

## App and navigation

`App.js` loads `src/App.tsx`, which supplies app providers, startup handling, and navigation. `src/hooks/usePrayerTimeApp.ts` coordinates saved settings, location, calculated prayer calendars, notifications, and the journal. `src/navigation/` defines tabs and routes. Screens compose shared components from `src/components/`.

`src/theme.tsx` supplies themed styles. `src/i18n/context.tsx`, `translate.ts`, and `native.tsx` provide translated messages, localized digits, script-aware fonts, and right-to-left behavior. Use these wrappers for user-facing text and controls. Bangla uses bundled Anek Bangla (400–800); Arabic uses bundled Tajawal (400, 500, 700, 800), with semibold labels mapped to its Bold face. English uses Bricolage Grotesque, including a default for otherwise unstyled text. Startup registers the English faces in parallel with settings restore, then waits only for the saved language’s additional faces. Other languages preload after the splash finishes; language changes await font registration before committing so navigation stays mounted. Font assets are bundled and need no Google Fonts request on native.

`src/constants/appearance.ts` defines the shared light, dark, classic dark, Ivory (stored as `sand`), Rose, and Midnight Blue palettes. System appearance resolves to light or dark; named light palettes stay light even on a dark phone. The Appearance sheet previews the selected illustration on each palette. The original purple Light palette and Classic dark remain available. Artwork retains its original lavender and ivory colours; each palette sets its surrounding gradients and illustration opacity, shared with native widgets. Widget payloads include both system variants so a saved widget can follow system appearance while the app is closed.

The Qibla needle uses an upright Kaaba symbol in the same bearing frame as the cardinal markers. `CompassCalibrationSheet.tsx` shows a figure-eight animation, honours reduced motion, and reports improved accuracy only from sensor readings. Low accuracy must persist for two seconds before the guide opens automatically, once per mounted Qibla screen; dismissing it leaves an inline guide while accuracy remains poor. Unknown or unsupported readings do not trigger the automatic guide. Navigation dismisses it and stops its animation. Sensor behaviour still requires physical-device checks.

## Prayer calculations and dates

`src/services/prayerTimes.ts` calculates prayer times with `adhan`. `prayerPeriods.ts` resolves the active prayer period. Calendar date keys represent days in the selected location's time zone, not necessarily the phone's time zone. Overnight Isha can belong to the previous prayer day. Preserve these semantics when changing summaries, deep links, reminders, or widgets.

`prayerClock.ts` schedules updates using the last rendered time, including prayer starts, sunrise, and prohibited-window boundaries. A boundary that passes before the timer is installed must trigger immediate catch-up. A thirty-second heartbeat handles clock changes and midnight; returning to the foreground also refreshes time.

The displayed civil Hijri date supports a saved adjustment from −2 to +2 days. This affects calendar labels and automatic Ramadan visibility, including widgets; it never changes prayer instants. Calculation methods, local moon sighting, and the six/fifteen-minute prohibited-time buffers still require a qualified editorial policy review before release.

## Local persistence

Settings and location are validated in `src/services/storage.ts`. `useSavedValue.ts` supports persisted state elsewhere. The prayer journal uses one AsyncStorage value per date in `prayerJournal.ts`; writes are serialized and existing entries are merged. Journal exemptions preserve stored checkmarks and exclude the day from counts. `usePrayerJournal.ts` exposes loading, saving, retries, and user actions.

`journalOverview.ts` calculates report periods. Completed, non-exempt days in weeks with records contribute to missed counts. Weeks with no records stay unassessed. Today is excluded until its prayer day completes. `weeklyReflection.ts` derives a relevant context for the 54 sourced reflections. `reflectionHistory.ts` stores stable weekly assignments and selects unread eligible lessons before recycling a collection. `useWeeklyReflection.ts` resolves the saved choice when the journal is focused. Exemptions and sparse logging constrain suitability without judging the reader's faith. No AI service or journal upload is involved. See [the collection and selection rules](reflections.md).

Persistent data belongs to users. Storage changes need backward compatibility tests or a migration; changing a key silently creates an apparently empty journal.

Unreadable settings/location/counter JSON stops restore or persistence rather than being silently overwritten. Explicit recovery archives the original bytes before removing the damaged live value; an archive failure prevents removal. Journal opening isolates individual damaged days, keeps healthy days usable, and excludes unreadable days from assessments. Writes to a damaged day stay blocked until recovery.

`recordBackup.ts` provides a bounded, versioned JSON export/import for journal and Tasbeeh records. Settings, location, notification schedules, and their recovery archives are excluded. Unreadable record bytes export as inert archives. Import validates the whole document before writing, preserves current journal entries/exemptions, uses higher counter totals, and saves a before-import snapshot. Imports merge rather than replace; a storage failure can leave a partial merge with the previous values archived. Counter save revisions prevent pre-import queued saves from overwriting imported totals. Device sharing and document picking live in `recordBackupDevice.ts`; exports are unencrypted files and users choose where to keep them.

## Platform services

Notification scheduling is coordinated by `notifications.ts`, `reminderSync.ts`, and `reminderWindow.ts`. Android's local reminder-access module reads exact-alarm and notification settings. Inspecting access must not open a permission screen; prompts belong to explicit user actions.

`prayerNotificationPlan.ts` merges independent opt-in start notifications for all five prayers with the existing per-prayer end reminders. Both settings default to off. Android schedules up to fourteen days (140 notifications with both kinds); iOS keeps the nearest 60 across both kinds, about six days with all enabled. Reopening the app replenishes the queue. Reconciliation identifies both kinds through OS metadata, including after interrupted storage writes.

`backgroundRefresh.native.ts` defines an optional Expo background task at module scope and requests a twelve-hour minimum interval when reminders are enabled. `backgroundSchedule.ts` rechecks the persisted opt-in and saved location each time. It never prompts for permission or requests GPS. It replenishes notifications and widget timelines, and disabled reminders cancel only this app's tracked reminders. Both foreground and background scheduling use the same serialized queue. The OS chooses execution time, can suppress tasks, and force-quitting can stop background work. Settings therefore shows the saved scheduling horizon and advises occasional opening. Widget-only users still need to open the app before their fourteen-day timeline expires; this is not an indefinite delivery guarantee. See [Expo's background task constraints](https://docs.expo.dev/versions/latest/sdk/background-task/).

iOS always-location usage declarations are explicitly disabled in the location config plugin; background refresh uses saved coordinates and only foreground location permission is declared. Android channels omit the optional sound filename to use the OS default, avoiding this SDK's interpretation of the string `default` as a missing custom asset. Existing channel preferences are preserved.

Widget timelines are generated in `widgetTimeline.ts`, published through platform-specific home-screen-widget services, and synchronized through `syncHomeScreenWidget.ts`. Android uses a local Kotlin module; iOS uses layouts in `src/widgets/`. Widgets consume a saved schedule and need refreshing when relevant app settings or location change.

Android widgets use a normal exact alarm alongside an idle-allowed alarm, when precise timing is permitted. This avoids depending solely on throttled idle alarms for short windows. A process-scoped screen receiver catches up on screen-on/unlock while that process lives; boot, clock changes, and precise-timing permission grants also refresh the saved timeline. Inexact alarms and device power restrictions can still delay a launcher update. Native changes require a new installed build; a JavaScript refresh is insufficient.

The widget hook depends on calculation inputs and presentation preferences, with a 180ms debounce before formatting. Notification and journal toggles do not rebuild its timeline. Android broadcast receivers hand work to a single executor, coalesce queued events, and always finish pending broadcasts. A six-MiB LRU cache reuses rendered artwork without caching time-sensitive text. New native changes must be checked in an installed build.

Each widget has its own information priority: Next prayer shows one upcoming start, Prayer card uses the live countdown, Day summary pairs the current prayer with sunrise/sunset (or Sehri/Iftar), and Prayer times aligns five starts with a single current-row highlight. Full prayer ranges remain in the timeline and in screen-reader descriptions. Detailed widgets use a tinted version of the selected theme's surface, with visible artwork and semantic muted/border/highlight colors; the countdown and small card retain the original illustration-led gradient. Original Light remains unchanged elsewhere in the app.

Android adapts padding and secondary details to the available height and effective text size. App and system text enlargement use the larger setting rather than multiplying both enlargements. Artwork is rasterized to the widget's aspect ratio, with bounded dimensions, pixel count and cache memory. Android 12+ receives at most two exact-size RemoteViews variants for portrait/landscape; older hosts use size-change callbacks. Gallery-only layouts display illustrative captures, while initial/live layouts always use calculated data or a setup prompt. Gallery captures add no image decoding to app startup.

The in-app widget picker uses an Appearance-style grid with four miniature previews, names, selected indicators and one Add action. Previews share a single timeline snapshot from sheet opening or a settings change, with no recurring preview timer; they keep their content during exit. Narrow screens and enlarged text use one column. Artwork uses a trailing-aligned cover crop, its real source aspect ratio, and directional theme scrims so no image edge falls inside the widget. The Prayer card groups its title and phase, includes a localized focused time window when space permits, and always draws an opaque, theme-coloured progress track even at zero elapsed time. Waiting phases show an explicitly labelled target rather than a prayer interval. iPhone widgets keep platform-appropriate family layouts, monospaced time digits, explicit Arabic column ordering, explicit timer locale settings and accessible full-period labels.

`withWidgetLayoutDirection` runs after the iOS widget generator and gives the extension's entry views a left-to-right coordinate base. Widget JS then applies the saved app language explicitly, including the progress direction, so a phone already using Arabic doesn't mirror the layout twice. This setting is confined to the widget extension. The plugin fails clearly if an SDK template change removes the expected entry view.

`python3 scripts/render-widgets.py --device emulator-PORT` builds temporary instrumentation in the ignored Android project, renders real RemoteViews through a parcel round-trip, and checks text clipping across themes, English/Bangla/Arabic, compact sizes, enlarged text, fasting, prohibited and empty states. It refuses physical devices, restores the widget timeline and generated-project changes, and writes captures under `review/widget-refinement/native`. Use `--update-gallery` to regenerate the four gallery images from synthetic Light-theme fixtures. Native CI runs these checks before the interactive smoke flows. See [Android's responsive layout guidance](https://developer.android.com/develop/ui/views/appwidgets/layouts) and [Apple's widget design guidance](https://developer.apple.com/design/human-interface-guidelines/widgets).

An app-level render error boundary offers a retry without resetting storage. Diagnostics are limited to thirty in-memory status/timing events; no error messages, location, journal content, network uploads, or third-party telemetry are included. Saved records exposes these local diagnostics. The branded splash now uses a 320ms reveal and 160ms exit once startup data and the selected fonts are ready; this is an animation budget, not a measured phone cold-start time.

## Tests

`tests/` uses the Node test runner through `tsx`. Most tests exercise pure calculations and storage/service boundaries with local fixtures. Native module tests and web exports complement, but do not replace, installing and testing a native build.

`.github/workflows/native.yml` builds an Android debug app and unsigned iOS app/widget extension. Android runs `.maestro/smoke.yaml` against a dedicated emulator with synthetic data. `scripts/seed-emulator.py` refuses physical devices, non-debuggable installs, and an existing app database. It never clears a device's data. The pinned Maestro download is checksum-verified and CLI analytics are disabled. Local iOS compilation requires Xcode; device-only checks and editorial handoff are tracked in [release readiness](release-readiness.md).

Shared sheets move accessibility focus to the heading after opening. Radio groups label their choices, the explicit close button stays accessible, and the decorative backdrop does not create a second screen-reader close target. VoiceOver/TalkBack behaviour still needs hands-on validation.

## Repository boundaries

The root package is the mobile app. Generated native projects, build artifacts, review captures, marketing production projects, and credentials are not source dependencies. Avoid adding machine-specific paths, generated output, or production user data to commits.


The home-screen widget sheet uses four preview tiles and one platform-specific add/help action. Setup instructions and errors appear after that action rather than as permanent explanatory paragraphs.

Qibla calibration opens automatically after two seconds of continuously poor reported sensor accuracy (levels 0 or 1), once per mounted screen. Unknown or unavailable accuracy does not trigger calibration. Dismissing the guide leaves an inline animated guide while accuracy is poor. The animation demonstrates a figure eight followed by holding the phone flat, stops when accuracy improves, and provides static instructions with reduced motion enabled. Leaving the screen closes the sheet and stops its animation.


Settings retain the active picker separately from its visibility, so selection sheets keep their title, options, and height during exit. Closing sheets disable further touches until dismissed. Retired `sage` preferences validate to the original Light appearance.

Prohibited-time cards use compact clock ranges without a repeated day period; morning/noon/evening labels and full accessibility labels provide that context. At standard phone widths they remain a three-column grid in all languages. Narrow screens and larger text use horizontal label/time rows. Prayer schedules on Home and Calendar give compact time ranges more spacing and permit wrapping without truncation.
