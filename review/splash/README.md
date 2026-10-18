# Animated splash

The splash is drawn with SVG and gradients in `src/components/AnimatedSplash.tsx`. The title uses the app's bundled Bricolage Grotesque ExtraBold font. There is no subtitle or full-screen bitmap artwork.

The mosque fades in and rises 12 points, the title follows 160 ms later, and the bottom arches rise 22 points. A slow glow runs behind the artwork. The entrance finishes in 1 second, then the splash fades over the mounted app in 280 ms once saved settings and fonts are ready. It runs once per app mount. Reduced motion skips the movement and transition delay. Animations stop when the splash unmounts.

The native launch screen uses the same lavender background and a transparent launch asset. A new native build is required for the launch-screen configuration change; Expo Go cannot verify it.

Validation:

- TypeScript and ESLint pass.
- All 54 existing tests pass.
- Android JavaScript/Hermes bundle export succeeds.
- Browser checks at 390 × 844 and 370 × 540 confirm the title animation, correct font, absent subtitle, and transition into onboarding without runtime errors.
- Reduced-motion browser check confirms there is no animated movement.

See `browser-checks.json` for measured browser results and the PNG previews for the final layout. Native launch-screen handoff and native animation performance still need device verification in a rebuilt app.
