# Configuration and builds

## Optional environment variables

Copy `.env.example` to `.env` and restart Expo after changing values. A fresh native build is needed to change values in an installed release.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_LOCATIONIQ_API_KEY` | LocationIQ city search and reverse geocoding. Without it, use phone location or manual coordinates. |
| `EXPO_PUBLIC_DONATION_URL` | Optional support link. An empty value uses the project's default support page. |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Optional hosted privacy-policy link. The app also includes a local privacy information sheet. |

All `EXPO_PUBLIC_*` values are visible in the built app. Never use them for server credentials. Use your own client key and configure provider restrictions and quotas. Automated tests do not require a real key. The earlier `VITE_LOCATIONIQ_API_KEY` alias is not used by the app.

Prayer times are calculated locally. City search and location-name lookup send requests to LocationIQ when configured; location permission and network access are distinct. See `src/services/locationIq.ts` and `src/services/location.ts` when changing this behavior.

## Native development

`npm run android` and `npm run ios` invoke Expo native builds and generate ignored root native projects. Keep durable native changes in `modules/`, Expo config plugins in `plugins/`, and configuration in `app.json`. Native module/plugin changes require rebuilding the app; a JavaScript refresh is insufficient.

Expo Go and web previews do not verify custom Android reminder permissions or widgets. iOS widget layouts use `expo-widgets`; Android widgets are implemented in the local `prayertime-widgets` module. Test native behavior on the relevant platform.

## EAS builds and forks

`eas.json` defines preview APK and production App Bundle profiles. Production builds use remote versioning and automatic version increments. EAS hosting and signing require an account; local development does not require access to the maintainer's EAS project.

When distributing a fork, replace the EAS project ID in `app.json` with your own project configuration. Set your own Android package, iOS bundle identifier, URL scheme, widget bundle identifier, and app-group identifier. Keep related iOS app/widget identifiers consistent. Use your own signing credentials. These identifiers are public configuration, not credentials.

For updates to the existing PrayerTime Play Store app, preserve the application identity and signing setup. Increment the Android version code through the existing release workflow. Install over the previous build to test local journal compatibility; do not uninstall or clear storage. The app currently disables Android backup and does not provide journal export or cloud sync.

`.easignore` controls the native build archive separately from `.gitignore`; keep shared exclusions aligned. Source under `modules/`, `plugins/`, and `assets/` must remain available to builds.
