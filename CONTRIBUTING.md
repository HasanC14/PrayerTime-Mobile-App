# Contributing to PrayerTime

Thank you for helping improve PrayerTime. Small fixes, accessibility improvements, translations, tests, and documentation are welcome.

## Development

1. Fork and clone the repository, then create a focused branch.
2. Use Node 24 and run `npm ci`.
3. Copy `.env.example` to `.env` if configuring optional services. Never commit credentials.
4. Run `npm run web` for UI development, or a native build for device features.
5. Make a focused change, run the relevant checks, and open a pull request.

Follow the existing TypeScript and component conventions. Use the theme and shared UI components rather than adding separate styling systems. Keep unrelated formatting or dependency changes out of a feature PR. Commit the root `package-lock.json` when dependencies change.

## Validation

Run `npm run check` before submitting. Expo Doctor may need network access. CI also performs a web export; you can reproduce it with `npx expo export --platform web`.

Add regression tests when changing calculations, journal storage, reminders, date boundaries, permissions, or other behavior. Tests should check observable behavior rather than copy implementation details. Documentation-only changes do not need new tests.

For UI changes, check compact screens, larger text, light/dark themes, and Arabic right-to-left layouts. Include a screenshot when helpful. For native changes, state the device, OS, build type, and checks performed; a passing web preview does not verify notifications, sensors, or launcher widgets.

## Data compatibility

Existing users have local prayer records. Preserve storage keys and old record formats, or supply a tested migration. Do not clear app storage to solve migration issues. Test upgrades over an existing installation without uninstalling it. Include week/month boundaries, overnight Isha, time zones, and exempt days when changing journal summaries.

## Translations and religious content

User-visible messages belong in `src/i18n/messages.ts`. Supply Bangla and Arabic translations with the same interpolation placeholders as the English source. Check Arabic direction and localized numbers.

For Quran and hadith passages, include an exact reference, translation attribution, and source URL. Clearly label excerpts, keep app advice separate from quotations, and preserve context. Do not generate scripture or silently machine-translate quotations. Discuss larger content collections before adding them, and check redistribution terms for translations and artwork.

## Pull requests

Explain the problem, the resulting behavior, and how you verified it. Link any related issue. Mention native rebuild requirements, storage migrations, and checks you could not run. A maintainer will review the change before merging.

## Conduct

Be respectful, assume good intent, and give actionable feedback. Follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Use [SECURITY.md](SECURITY.md) for sensitive reports rather than posting credentials or personal data in an issue.
