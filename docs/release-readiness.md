# Release readiness

These checks distinguish automated evidence from work that needs an installed phone, a release account, or an independent reviewer. Unchecked items are release work, not claimed completed implementation.

## Repository preparation — 16 November 2026

The public README, backup guide and font credits were updated. Old generated test exports were removed; native module source, app changes, tests and review evidence were preserved. The Play Store update pack stays local and ignored by Git. See [public release steps](public-release.md).

Compatible patches update Expo to 57.0.33, background-task/task-manager to 57.0.23, and sharing to 57.0.26. The final npm audit reports 10 moderate advisories, with no high or critical advisories. TypeScript, lint, all 230 tests, all 21 Expo Doctor checks, and Android/iOS/web JavaScript exports pass. Native builds must be rebuilt after these package updates; no signed store build or physical-device checks were performed in this preparation.

## Local evidence — 6 November 2026

- TypeScript, lint, the 227-test suite and all 21 Expo Doctor checks pass. Android/iOS/web production JavaScript exports succeed.
- Full Android debug build succeeds, including the local Kotlin modules and all default ABIs. The installed API 35 emulator passes three Maestro flows: journal/counter persistence and picker behaviour, English/Bangla/Arabic settings and backup controls, and notification opt-in/coverage/opt-out. Native logs confirm registration and unregistration of the background worker. Notification cancellation leaves the app opted out.
- The backup sheet has also been visually checked on the web in all three languages, including heading focus and a single accessible close action.
- iOS native generation succeeds. The generated plist includes the background processing identifier and foreground-only location declarations. Actual iOS compilation and hosted CI have not been run locally; Xcode is not installed on this machine.

## Automated and local verification

The 12 November widget pass adds an Appearance-style picker, a focused time window, persistent progress tracks, stronger theme-aware artwork and bounded gallery previews. Typecheck/lint, 230 unit tests, all 21 Expo Doctor checks and all-platform JavaScript exports pass. Android native render coverage is now 188 cases, including artwork variants, progress pixels, legacy payloads and gallery dimensions. API 35 launcher checks cover gallery appearance, Next prayer placement and lock/unlock. See [the widget release review](widget-release-review.md) for the evidence and remaining release gaps; native iOS verification is still pending.

Widget refinement was checked on 8 November 2026: 228 unit tests, typecheck/lint, all-platform JavaScript exports, the Android native build, and 79 real RemoteViews render cases pass. The renders cover all themes, English/Bangla/Arabic, compact and enlarged-text layouts, fasting/prohibited/empty states, wide cards, and gallery layouts. They exercise parcel serialization as well as inflation and inspect text bounds. In-app previews were also checked in all three languages at 320px and 390px widths. These are native off-screen render checks; launcher-specific placement, live alarm delivery and physical-device behaviour still need the checks below. iPhone layouts were updated and bundled, but require native iOS visual verification.

To repeat the widget checks on a dedicated emulator after prebuild, run `python3 scripts/render-widgets.py --device emulator-PORT`. It preserves app data and restores temporary generated-project changes. `--update-gallery` refreshes the illustrative gallery images from synthetic fixtures; rebuild afterward to package those assets. Native CI runs the renderer before Maestro.

- Run `npm run check` and `npx expo export --platform all` after dependency or native changes.
- Android: `npx expo prebuild --platform android --no-install`, then `cd android` and `./gradlew :app:assembleDebug --no-daemon`. For faster local builds select the emulator's ABI with `-PreactNativeArchitectures=arm64-v8a` (Apple Silicon) or `x86_64` (Linux CI).
- Run the flows only on a dedicated debug emulator. Install the APK without launching, run `python3 scripts/seed-emulator.py`, start Metro on port 8081, `adb reverse tcp:8081 tcp:8081`, and allow exact alarms on that emulator with `adb shell appops set com.hasanbuilds.prayertime SCHEDULE_EXACT_ALARM allow`. Then run `MAESTRO_CLI_NO_ANALYTICS=1 maestro test .maestro/`. The seed refuses an existing database. The persistence flow expects its clean fixture; localization restores English and notification checks restore the disabled setting before exiting. The emulator permission fixture does not test a person's permission-denial journey. Keep production data out of screenshots and CI artifacts.
- The native workflow compiles iOS and its widget extension on a macOS runner. It has not been run in hosted CI merely by adding the workflow. Local Xcode is required to reproduce that job.
- Storage tests cover archive-before-delete, failure preservation, isolated damaged journal days, merge conflicts, backup privacy, validation-before-write, and queued stale counter saves. Background tests cover saved opt-in, missing location, denied access, and failure retry outcomes.

## Installed device checks

- [ ] Android and iPhone: advance through prayer/prohibited-window boundaries, midnight, DST, timezone/clock changes, foreground return, reboot, and prolonged offline use. No expired negative countdown may remain on app or widget.
- [ ] Enable start/end notifications independently and together. Confirm delivered prayer name/time, then inspect pending counts and coverage dates. Toggle off and verify cancellation. Revoke notifications/exact-alarm access and check the explanation and recovery path.
- [ ] Allow background execution and inspect replenishment; also test force-stop, low power, battery restriction, and iOS background refresh disabled. Delivery and launcher repaint timing remain OS-controlled. Widget-only users still need occasional app openings.
- [ ] Exercise all four native widgets, resizing, lock/unlock, themes, Bangla/Arabic, and exact-alarm permission changes. Profile broadcast duration, artwork cache memory and timeline generation on a lower-end Android phone. Desktop formatting timings are not phone benchmarks.
- [ ] VoiceOver/TalkBack: heading focus on each sheet, reading order, selected radio choices, close/back, prayer checks, counter value, large system text, and reduced motion. Measure touch targets and contrast in all themes.
- [ ] Export/share/import on both platforms, cancel the file picker/share sheet, reject a malformed/oversized file, and restore a backup on a second clean install. Verify corrupt-value recovery with a debug-only fixture and preserve originals after simulated disk failure.
- [ ] Qibla figure-eight/flat animation and automatic calibration on real magnetic sensors, including persistent poor, unknown and recovered accuracy. The emulator cannot establish calibration quality.
- [ ] Measure release cold launch, first interactive frame, font fallback, RAM and APK/IPA sizes. Keep the existing bundled fonts; native embedding or artwork asset conversion needs measured benefit and verified font aliases/visual parity before adoption.

## Independent Islamic editorial review

- [ ] Have a qualified reviewer check all 54 reflections in English, Bangla and Arabic against their passage and tafsir sources in [reflections.md](reflections.md). Record reviewer, date, item ID, wording approval and any corrections. Source links and automated structural checks do not constitute scholarly approval.
- [ ] Verify Quran quotation boundaries, translation/tafsir attribution and reuse permissions. Distinguish an editorial explanation from the source's own wording.
- [ ] Confirm that journal context describes logging, not a judgment of faith or proof that prayer was missed. Review exemptions, encouragement, accountability and terminology in each language.
- [ ] Approve supported calculation methods, high-latitude behaviour, prohibited-time buffers and the civil Hijri date policy. Verify the −2…+2 adjustment and automatic Ramadan card against the intended local practice.

## Dependencies and production settings

Compatible Expo SDK 57 patch updates remove the previously reported high/low advisories. The 12 November audit reports eleven moderate advisories in upstream dependency chains (glob/minimatch/uuid and their dependants); there are no high or critical advisories. The earlier 6 November audit recorded thirteen moderate advisories. CI now gates high/critical advisories with `npm audit --audit-level=high`. Re-run the audit before release because advisory data changes. Do not run `npm audit fix --force`: its proposed Expo 52 downgrade is incompatible with this app. Revisit upstream compatible releases or isolate/remove affected development tooling when a supported fix is available.

- [ ] Run hosted Android/iOS CI on the actual PR and inspect failures. Build a signed release through the existing release process; the debug smoke build is not a store release.
- [ ] Verify the production privacy URL, app-store privacy/data-safety answers, donation links, LocationIQ token restrictions/quotas and permissions in release accounts. Repository review cannot verify remote account configuration.
- [ ] Confirm the storage threat model: AsyncStorage uses the app sandbox, not application-level encryption. Exports are explicitly user-shared, unencrypted JSON; they exclude app settings, saved location and schedules. No automatic cloud sync or analytics was added.
- [ ] Rebuild and install the native app after these changes. JavaScript refresh/OTA alone cannot install the new task, document-picker and sharing modules or native widget fixes.
