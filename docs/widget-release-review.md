# Widget updates and release review — 12 November 2026

## Implemented

- Appearance-style widget picker: four miniature previews with names and selection indicators, one Add action, and a single-column fallback for narrow screens or enlarged text. Thumbnails use one snapshot, without recurring countdown timers.
- Prayer card: adjacent name/phase, a secondary localized time window, and a persistent theme-coloured progress track. Waiting phases show the labelled target time; compact cards preserve the countdown and footer before secondary details.
- Artwork: original illustrations and theme choices preserved. A trailing-aligned cover crop removes the internal landscape-image edge. Detail cards have stronger theme tint and visible artwork. Prayer times uses one current-row highlight without bullets.
- Android gallery previews have explicit natural dimensions. Actual launcher testing exposed excess whitespace with unconstrained preview layouts; fixed-size previews remove it.
- Existing native widget identifiers and saved payload compatibility are preserved. The app's main artwork and global theme palettes are unchanged. No dependencies or permissions were added.

## Verification

- Typecheck, lint, 230 unit tests, and all 21 Expo Doctor checks pass. Android/iOS/web production JavaScript exports succeed.
- Android debug app and native test builds succeed. 188 real RemoteViews render checks cover all artwork choices, themes, three languages, compact/enlarged text, fasting, prohibited, empty and legacy payloads, and gallery sizing. Progress checks inspect the pixels at 0%, 1%, 50%, 99% and 100%, including Arabic direction and theme colours.
- The web picker passes selection, bounds, snapshot, Add feedback and reopen checks at 320px, 390px and 620px. Language checks cover English, Bangla and Arabic; 140% app text uses one column without clipped captions.
- On an API 35 Pixel launcher emulator, gallery previews were inspected and the Next prayer widget was added to the home screen with synthetic Dhaka data. Display was checked after lock/unlock. This does not establish physical-device delivery, every launcher's resize behaviour, or iPhone parity.
- Native captures and the picker screenshot are in ignored `review/widget-polish/`. Repeat native checks with `python3 scripts/render-widgets.py --device emulator-PORT --output review/widget-polish/native` on a dedicated emulator.

## Remaining work — reported, not implemented

| Priority | Finding or verification gap | Next action |
| --- | --- | --- |
| Before release | iOS native compilation and visual checks remain unverified; this machine has command-line tools but no Xcode. JavaScript export does not validate SwiftUI layout. | Run hosted iOS CI and install a native iPhone build; inspect all widget families, themes, RTL and text sizes. |
| Before release | Physical-device boundary and delivery checks are still unchecked in the release checklist. Emulator renders cannot prove timely launcher refresh or notifications under battery restrictions. | Exercise prayer/prohibited transitions, midnight, denied exact alarms, reboot, offline use and low-power modes in the signed release build. Check all four widgets on the supported launchers. |
| Before release | The existing editorial and production-account checks are not recorded as approved. The privacy-policy link is optional in code and disappears when its environment value is unset. | Record qualified review of the 54 reflections and their attributions; verify the production privacy URL, store disclosures, LocationIQ configuration, donation link and signed build configuration. |
| Follow-up | The current audit reports 11 moderate advisories in upstream dependency chains, with no high or critical advisories. No dependency changes were made in this widget pass. | Review compatible upstream fixes separately; do not apply an incompatible forced Expo downgrade. |
| Follow-up | Android's native countdown currently uses the phone's numeral locale: the English-locale emulator shows Latin countdown digits even when the app's Bangla/Arabic labels and formatted prayer times are localized. | Decide whether to accept the system-native numeral behaviour or investigate a supported localized live-countdown solution separately. |

The wider installed-device and editorial checklist remains in [release-readiness.md](release-readiness.md). No unrelated fixes, production configuration changes, commits, or publication were performed as part of this widget update.
