# Qibla markings, text size, Tasbeeh, and the prayer card

The live Qibla arrow previously used a phone-relative bearing while N/E/S/W stayed north-up. The arrow and cardinal labels now share the same coordinate frame. Facing west moves W to the top of the dial; N moves to the right. Without a reliable heading, the dial returns to a clearly labeled north-up view. The bearing remains calculated for the selected location; it is not fixed to west. Phone-facing direction and degrees are shown below the dial.

Settings → Display contains a text-size slider, minus/plus buttons, and reset. Size runs from 90% to 140% in 5% steps, persists with the other settings, and applies through the shared Text and TextInput components. The phone's accessibility scaling still applies. The slider supports touch dragging, keyboard arrows, Home/End, and native accessibility increment/decrement actions. Compact prayer rows and calendar cells make room for larger text.

Tasbeeh is a fifth tab. General targets 100, SubhanAllah/Alhamdulillah/Allahu Akbar each target 33, and Astaghfirullah targets 100. Every preset has its own saved count. Custom counters accept a name or dhikr and a target from 1 to 99,999, including Bangla, Arabic, and Persian numeral entry. Counters can continue beyond their target. The progress ring animates subtly; target completion uses native success haptics. Undo, reset confirmation, and custom deletion are included. Picker, creation, and confirmations share one modal to avoid overlapping native presentations.

Counter state stays on the device. Writes are serialized and debounced, with an immediate flush on background/unmount. A failed read never overwrites an existing saved counter. Write failures preserve the in-memory count and report an issue. Stored ids, counts, names, and targets are validated, and deleting a custom item preserves other counters.

The main prayer card uses the existing lavender palette, a prayer icon and current/upcoming status, a stronger countdown, an end/start time, and next-prayer details. The large decorative watermark is replaced with useful timing information. Compact layouts combine shared boundary times to keep the card shorter. Guidance warnings and all prayer calculations retain their existing behavior. New copy is translated into Bangla and Arabic.

## Validation

- TypeScript and ESLint pass; all 83 automated tests pass.
- Expo Doctor passes all 21 checks.
- Android and iOS production JavaScript/Hermes exports pass; this does not constitute an APK/AAB or an iOS native build.
- `browser-checks.json` covers real Expo web UI interactions, presets, completion, custom creation, persistence after reload, undo/reset/delete, one-modal transitions, dragging the slider, keyboard controls, all five screens, 390/320-pixel layouts, three languages, dark appearance, and maximum text size.
- `tasbeeh-persistence.json` records checks of the actual hook with mocked storage/lifecycle adapters: failed restore, retry, rapid counting, background flush, failed writes, and unmount flush.
- `qibla-headings.json` checks the actual Qibla screen at six simulated sensor headings. Compass screenshots from that isolated harness use substituted icon rendering and fallback fonts; normal UI screenshots come from the Expo preview.

No physical phone was connected. Actual heading sensor accuracy, TalkBack/VoiceOver, native keyboard presentation, and haptics still need device checks. Launcher/native module installation remains covered by the earlier native-build notes in `review/polish/README.md`.
