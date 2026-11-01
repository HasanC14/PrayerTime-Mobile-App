# PrayerTime

A mobile prayer companion built with Expo, React Native, and TypeScript. Prayer times are calculated on the device, with a private Salah journal, weekly reflections, Qibla direction, Tasbeeh, a calendar, and home screen widgets.

- English, Bangla, and Arabic, including right-to-left layouts.
- Local prayer calculations with configurable methods and reminders.
- Prayer journal with weekly/monthly history, exempt days, and sourced reflections.
- Light and dark appearances, adjustable text sizes, and prayer card artwork.
- Android native reminder controls and widgets; iOS widget integration.

No account is required. Journal entries stay on the device; backup and sync are not implemented. Location search and optional external links need internet access. Native behavior varies by platform and must be checked on a device.

## Get started

Use **Node.js 24** (24.3 or newer) and npm. The repository includes a lockfile; use `npm ci` for reproducible installs.

```sh
git clone https://github.com/HasanC14/PrayerTime-Mobile-App.git
cd PrayerTime-Mobile-App
nvm use
npm ci
cp .env.example .env
npm run web
```

`nvm use` is optional if Node 24 is already installed. Open the local URL printed by Expo. You can explore the app without an API key using phone location or manual coordinates. An optional LocationIQ key enables city search and reverse geocoding. See [configuration](docs/configuration.md).

For mobile previews, run `npm start` and follow Expo's instructions. Expo Go can preview supported screens, but it does not include this project's custom native modules. Android widgets, exact-alarm access, and iOS widgets require a native build.

```sh
npm run android  # Android SDK + emulator or connected device required
npm run ios      # macOS + Xcode required
```

These commands generate local native projects. Keep changes in `modules/`, `plugins/`, and `app.json`; generated root `android/` and `ios/` directories are ignored.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run check
```

`npm run check` runs the first three checks plus Expo Doctor, which may need internet access. CI runs these checks and exports the web app. Tests use local fixtures and mocked services; no production credentials are required. See [contributing](CONTRIBUTING.md) for device checks and [dependency maintenance](docs/dependencies.md) for outstanding audit findings.

## Repository map

| Path | Purpose |
| --- | --- |
| `src/screens/`, `src/components/` | App screens and shared UI |
| `src/hooks/`, `src/services/` | App state, calculations, storage, reminders, and widgets |
| `src/content/` | Sourced prayer reflection passages |
| `src/i18n/` | English, Bangla, and Arabic translations |
| `src/widgets/` | iOS widget layouts |
| `modules/` | Local Expo native modules, including Android widgets |
| `plugins/` | Expo config plugins applied during native generation |
| `assets/` | Bundled icons, artwork, and splash images |
| `tests/` | Automated behavior and regression tests |
| `docs/` | Architecture and configuration guides |

Marketing projects, review screenshots, build outputs, local environment files, and signing credentials are excluded from Git. They are not required to build the app.

## Contribute

Read [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture guide](docs/architecture.md), and the [code of conduct](CODE_OF_CONDUCT.md). Use GitHub issues for bugs and feature proposals. Report sensitive issues using [SECURITY.md](SECURITY.md).

## License and credits

Project-owned code is licensed under [MIT](LICENSE). Dependencies and third-party material retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). The PrayerTime name and logo do not imply endorsement of forks.
