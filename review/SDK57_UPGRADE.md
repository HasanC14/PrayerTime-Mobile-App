# Expo SDK 57 upgrade — 17 October 2026

Follow-up notification/location changes and current validation (54 tests): [device permission fixes](DEVICE_PERMISSIONS_FIXES.md).

The project is upgraded through SDK 55 and SDK 56 to **Expo 57.0.30**. Each intermediate version passed type checking, lint, and the 34 existing regression tests before the next installation.

| Component | Previous | Current |
| --- | --- | --- |
| Expo | SDK 54 | 57.0.30 |
| React Native | 0.81.5 | 0.86.3 |
| React / React DOM | 19.1.0 | 19.2.3 |
| TypeScript | 5.9 | 6.0.3 |

Expo modules, screens, safe-area handling, SVG, Babel, and ESLint dependencies are aligned with SDK 57. The lockfile is updated. Original manifests and configuration files are in `upgrades/sdk54-backup`; intermediate package/check summaries are in `upgrades/sdk55-validated.json` and `upgrades/sdk56-validated.json`.

## Migration changes

- Removed `android.edgeToEdgeEnabled`: newer Expo SDKs enforce edge-to-edge and no longer accept this config option.
- Replaced the removed `StyleSheet.absoluteFillObject` API with `StyleSheet.absoluteFill`.
- Updated sheet animation state and form/calendar resets for the newer React lint rules. Animation objects are initialized once, and prop-driven resets happen before committing the render. Compass shutdown retains a documented local lint exception so stale native sensor readings are cleared when its subscription stops.
- Added explicit Node test types and TypeScript's `types` configuration, as required by TypeScript 6 for the existing Node-based tests.
- Added a local-notifications facade that imports only the scheduling, permission, and presentation entry points. The notification package's root import also initializes remote push-token registration, which is incompatible with Android Expo Go on these SDKs. PrayerTime uses local reminders and does not need that registration. The Android production JavaScript bundle contains the local scheduler and excludes the push-token event and auto-registration code.
- Kept AsyncStorage 2.2.0 and the existing storage keys, preserving saved location/settings formats.

The local-notifications facade intentionally uses the package's `build/` entry points. Recheck those paths and initialization behavior during future SDK upgrades.

## Verification

- TypeScript 6 type checking: passed.
- ESLint: passed.
- Regression tests: **34 passed**.
- Expo Doctor: **21/21 checks passed**.
- Production JavaScript exports: Android, iOS, and web all passed.
- Android native configuration introspection: passed; package ID and permissions are retained. The React Native version catalog specifies minimum API 24 and compile/target API 36.
- Mobile-sized browser smoke test: **13 checks passed**, with no uncaught exceptions. This includes persisted manual location, calendar selection, light theme, invalid/valid alarm timing, sheet reopening and discarding unsaved edits, 24-hour display, privacy, Qibla bearing, synthetic GPS travel, and offline calculations. Results: `upgrades/sdk57-browser-checks.json`. Screenshots: `upgrades/sdk57-screenshots/`.
- Native GPS, compass sensors, and Android notification delivery still need verification on a phone. JavaScript exports and browser checks are not a signed APK/AAB build or an Expo Go device run.

The dependency audit reports **24 advisories: 15 high and 9 moderate, no critical**, down from the 38 remaining before this upgrade. These still require exposure review; no forced framework upgrade beyond SDK 57 was applied.

Disk space interrupted early installations. After removing generated partial installations and receiving approval to clear npm's disposable download cache, the complete dependency installation succeeded. Source files and original configuration backups were retained.

## Run on Android Expo Go

Stop any older Expo server with Ctrl+C, then run:

```sh
cd "/Users/hubxpert/PrayerTime Mobile App"
npm start -- --clear
```

Use Expo Go supporting SDK 57. Connect the Mac and Android phone to the same Wi-Fi, and scan the terminal's QR code in Expo Go.

If LAN connectivity fails:

```sh
npm run start:phone -- --clear
```

Use an installed preview/development build for final location and alarm tests. Existing privacy-policy, Play Console, signing, and production configuration tasks in `PLAY_STORE_REVIEW.md` still apply.

## Upgrade references

- [Expo SDK 55 release notes](https://expo.dev/changelog/sdk-55)
- [Expo SDK 56 release notes](https://expo.dev/changelog/sdk-56)
- [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57)
- [Expo SDK upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
