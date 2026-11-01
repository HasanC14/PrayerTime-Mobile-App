# Architecture

## App and navigation

`App.js` loads `src/App.tsx`, which supplies app providers, startup handling, and navigation. `src/hooks/usePrayerTimeApp.ts` coordinates saved settings, location, calculated prayer calendars, notifications, and the journal. `src/navigation/` defines tabs and routes. Screens compose shared components from `src/components/`.

`src/theme.tsx` supplies themed styles. `src/i18n/context.tsx`, `translate.ts`, and `native.tsx` provide translated messages, localized digits, script-aware fonts, and right-to-left behavior. Use these wrappers for user-facing text and controls.

## Prayer calculations and dates

`src/services/prayerTimes.ts` calculates prayer times with `adhan`. `prayerPeriods.ts` resolves the active prayer period. Calendar date keys represent days in the selected location's time zone, not necessarily the phone's time zone. Overnight Isha can belong to the previous prayer day. Preserve these semantics when changing summaries, deep links, reminders, or widgets.

## Local persistence

Settings and location are validated in `src/services/storage.ts`. `useSavedValue.ts` supports persisted state elsewhere. The prayer journal uses one AsyncStorage value per date in `prayerJournal.ts`; writes are serialized and existing entries are merged. Journal exemptions preserve stored checkmarks and exclude the day from counts. `usePrayerJournal.ts` exposes loading, saving, retries, and user actions.

`journalOverview.ts` calculates report periods. Completed, non-exempt days in weeks with records contribute to missed counts. Weeks with no records stay unassessed. Today is excluded until its prayer day completes. `weeklyReflection.ts` selects from the sourced content catalog using deterministic rules and calendar-week rotation. No AI service or journal upload is involved.

Persistent data belongs to users. Storage changes need backward compatibility tests or a migration; changing a key silently creates an apparently empty journal.

## Platform services

Notification scheduling is coordinated by `notifications.ts`, `reminderSync.ts`, and `reminderWindow.ts`. Android's local reminder-access module reads exact-alarm and notification settings. Inspecting access must not open a permission screen; prompts belong to explicit user actions.

Widget timelines are generated in `widgetTimeline.ts`, published through platform-specific home-screen-widget services, and synchronized through `syncHomeScreenWidget.ts`. Android uses a local Kotlin module; iOS uses layouts in `src/widgets/`. Widgets consume a saved schedule and need refreshing when relevant app settings or location change.

## Tests

`tests/` uses the Node test runner through `tsx`. Most tests exercise pure calculations and storage/service boundaries with local fixtures. Native module tests and web exports complement, but do not replace, installing and testing a native build.

## Repository boundaries

The root package is the mobile app. Generated native projects, build artifacts, review captures, marketing production projects, and credentials are not source dependencies. Avoid adding machine-specific paths, generated output, or production user data to commits.
