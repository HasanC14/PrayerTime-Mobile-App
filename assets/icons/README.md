# PrayerTime launcher assets

The mosque and crescent geometry comes from `src/constants/brandMark.json`, also used by the app's `BrandMark` component. SVG sources are included beside each PNG for future exports.

- `app-icon.png`: 1024 × 1024, opaque RGB, full background for iOS and legacy Android launchers.
- `adaptive-foreground.png`: 1080 × 1080, transparent background, padded lavender mark for Android adaptive launcher masks.
- `adaptive-monochrome.png`: the same padded silhouette in white with transparency for Android themed icons.

The adaptive foreground's furthest visible pixel is 301.5 px from the image center. All visible pixels fit inside the 330 px radius safe circle on this 1080 px canvas. Circle, squircle, and rounded-square previews are in `review/polish/icon-shapes.png`.

The colored mark uses the original logo’s pale lavender (`#CBB3D7` to `#BFA5D4`), with a light lavender background. Android themed icons use the system’s chosen color.

The foreground and monochrome assets are configured separately in `app.json`, with an `#F4EDF8` adaptive background. Expo prebuild generates the density variants and adaptive icon XML, including the monochrome layer. Changing these launcher assets requires a new native build.

References: [Android adaptive icon design](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive), [Expo app icon configuration](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).
