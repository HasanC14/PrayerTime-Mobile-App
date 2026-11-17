# PrayerTime

A simple prayer app. No ads. No account needed.

[Get it on Google Play](https://play.google.com/store/apps/details?id=com.hasanbuilds.prayertime)

## What it does

- Shows prayer times and optional reminders.
- Helps you find the Qibla direction.
- Keeps a private prayer journal, with weekly and monthly views.
- Includes a Tasbeeh counter and a prayer calendar.
- Supports English, Bangla, and Arabic.
- Offers light and dark themes, text sizes, and prayer card artwork.
- Includes home screen widgets for Android and iPhone.
- Lets you export and restore your journal and Tasbeeh records.

Prayer times are calculated on your device. Your records stay on your device unless you share a backup file. City search and some optional links need internet access.

Built with Expo, React Native, and TypeScript.

## Run it

Install [Node.js 24](https://nodejs.org/) (24.3 or newer) and npm.

```sh
git clone https://github.com/HasanC14/PrayerTime-Mobile-App.git
cd PrayerTime-Mobile-App
npm ci
cp .env.example .env
npm run web
```

Open the address shown in the terminal. If you use nvm, run `nvm use` first.

No API key is needed to try the app. Use your phone's location or enter coordinates. To enable city search, add your own LocationIQ client key to `.env`. See [configuration](docs/configuration.md).

## Run on a phone

```sh
npm start
```

Expo Go can show supported screens. Widgets and custom reminder controls need a native build:

```sh
npm run android
npm run ios
```

Android needs Android Studio and an emulator or connected phone. iOS needs macOS and Xcode. Rebuild after changing native modules or plugins.

The root `android/` and `ios/` folders are generated. Keep native source changes in `modules/`, `plugins/`, and `app.json`.

## Check your changes

```sh
npm run typecheck
npm run lint
npm test
```

`npm run check` also runs Expo Doctor and may need internet access. Tests use sample data and do not need API keys.

## Find the code

| Folder | What is inside |
| --- | --- |
| `src/screens/` | App screens |
| `src/components/` | Shared UI |
| `src/hooks/`, `src/services/` | App logic, storage, prayer times, and reminders |
| `src/i18n/`, `src/content/` | Translations and prayer reflections |
| `modules/`, `plugins/`, `src/widgets/` | Native features and widgets |
| `assets/` | App icons and artwork |
| `tests/`, `.maestro/` | Automated checks |
| `docs/` | Setup and technical notes |

Local keys, builds, marketing exports, and review images are ignored by Git.

## Help improve it

Ideas, bug reports, translations, and code are welcome. Start with [contributing](CONTRIBUTING.md). Please follow the [code of conduct](CODE_OF_CONDUCT.md). Use [the security policy](SECURITY.md) for private security reports.

Before publishing your own version, follow [the fork guide](docs/configuration.md#eas-builds-and-forks). Use your own app identifiers, keys, and signing account.

See [public release steps](docs/public-release.md) before making the repository public. Device checks and remaining app release tasks are in [release readiness](docs/release-readiness.md). A web preview does not test phone notifications, sensors, or native widgets.

## License

Project-owned code uses the [MIT license](LICENSE). Fonts, translations, and other third-party material keep their own terms. See [credits and notices](THIRD_PARTY_NOTICES.md).
