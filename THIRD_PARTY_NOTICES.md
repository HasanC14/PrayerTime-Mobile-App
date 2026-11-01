# Third-party notices and asset provenance

The MIT license covers project-owned material. It does not replace the licenses of dependencies, fonts, translations, reference artwork, or other third-party content. Preserve upstream notices when redistributing them.

## Dependencies and fonts

Direct and transitive dependency versions are recorded in `package-lock.json`; their license files are distributed in their npm packages. Native dependencies may carry additional notices in their packages. Review them when redistributing compiled applications.

The app uses Bricolage Grotesque, Noto Sans Arabic, and Noto Sans Bengali through the corresponding `@expo-google-fonts` packages. Preserve their bundled font licenses in redistributed font copies. Icons are provided through `@expo/vector-icons` and the project's own brand assets.

## Religious passages

`src/content/prayerReflections.ts` contains short English excerpts with source URLs and references:

- Quran translations attributed to Dr. Mustafa Khattab, *The Clear Quran*, accessed through Quran.com.
- Hadith translations attributed to Sunnah.com, with collection and hadith numbers.

These translations are attributed third-party material, not original MIT-licensed prose. Source links and attribution are not a substitute for permission. Review the relevant translation providers' redistribution terms before expanding the collection or reusing it separately. Keep practical app advice distinct from quotations.

## Bundled artwork

Launcher SVG sources are in `assets/icons/`; shared brand geometry is in `src/constants/brandMark.json`.

The prayer hero illustrations are bundled in `assets/illustrations/`. The Serenity illustration was generated for the project. Mosque skyline and Moonlit palms were derived from supplied image references; the generation process is documented in that directory. The maintainer has confirmed that they hold the rights needed to redistribute the derived illustrations publicly. Underlying third-party references retain their own terms; the source-code license does not relicense those references.

Local marketing videos, supplied audio, store exports, and review captures are excluded from this repository. They are not part of the app's source distribution.
