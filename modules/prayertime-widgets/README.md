# PrayerTime Android home screen widget

Local Expo module, discovered through the root `nativeModulesDir` configuration.
The module adds resizable Prayer card, Next prayer, Day summary, and Prayer times widgets using native RemoteViews. No extra
runtime dependency, internet request, background location permission, or running
React Native process is needed to display and advance its saved schedule.

`updateTimeline(json)` validates and atomically persists a precomputed timeline,
updates installed widgets, and schedules the next transition with a boundary
alarm. Android also requests a periodic update every 30 minutes. Refreshes are
serialized across native threads. Boot, app replacement, clock, and time-zone
broadcasts restore the transition alarm. Removing the last widget cancels it.

`requestPin(kind)` asks compatible Android 8+ launchers to show their add-widget
confirmation. A `true` result means the request was accepted, not that the user
installed the widget. Other launchers use the normal system widget gallery.

The timeline contains fourteen local calendar days and a terminal refresh
prompt. It is rebuilt when the app opens or its location/calculation/display
settings change. Widget scheduling is separate from notification scheduling and
does not consume the reminder quota. Boundary updates use already-granted exact-alarm access when available,
otherwise inexact alarms. Widget refresh timing is controlled by
Android and may be delayed during Doze or by the launcher.

Rebuild the Android application after adding this module. Expo Go and older
binaries have no native widget module; the Settings sheet handles that state.

The iPhone widget is implemented separately using `expo-widgets`, configured in
`app.json`, with layouts in `src/widgets/NextPrayerWidget.tsx`.

Each widget style has its own provider and gallery metadata. Pin requests include
a populated RemoteViews preview. Removing one style keeps updates scheduled while
other styles remain installed. Summaries and prayer lists also advance at local
midnight and sunrise using the same saved timeline.

Artwork is packaged by `plugins/withWidgetArtwork.js` from the app's original
assets. Native Canvas rendering samples the original image and adds the same
horizontal/bottom fades and dark colors, with bounded bitmap dimensions. It
falls back to a gradient if the file is absent. Prayer card countdowns use a
native Chronometer; progress is calculated on each update. An absolute target
time remains visible. Native launcher transitions can still be delayed by the OS.
