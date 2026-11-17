# Third-party notices and asset provenance

The MIT license covers project-owned material. It does not replace the licenses of dependencies, fonts, translations, reference artwork, or other third-party content. Preserve upstream notices when redistributing them.

## Dependencies and fonts

Direct and transitive dependency versions are recorded in `package-lock.json`; their license files are distributed in their npm packages. Native dependencies may carry additional notices in their packages. Review them when redistributing compiled applications.

The app uses Bricolage Grotesque, Tajawal (Arabic), and Anek Bangla (Bangla) through the corresponding `@expo-google-fonts` packages. Preserve their bundled font licenses in redistributed font copies. Icons are provided through `@expo/vector-icons` and the project's own brand assets.

## Religious passages

`src/content/prayerReflections.ts` and `src/content/additionalReflections.ts` contain Quran-based reflections. Short English translation excerpts are attributed to Dr. Mustafa Khattab, *The Clear Quran*, accessed through Quran.com. Passage and Tafsir Ibn Kathir links are kept with each reflection. App-written explanations are separate from quotations. See [the reflection guide](docs/reflections.md).

These translations are third-party material. The MIT license does not cover them. Source links do not replace permission. Check the providers' reuse terms before redistributing or expanding the collection.

## Bundled artwork

Launcher SVG sources are in `assets/icons/`; shared brand geometry is in `src/constants/brandMark.json`.

The prayer hero illustrations are bundled in `assets/illustrations/`. The Serenity illustration was generated for the project. Mosque skyline and Moonlit palms were derived from supplied image references; the generation process is documented in that directory. The maintainer has confirmed that they hold the rights needed to redistribute the derived illustrations publicly. Underlying third-party references retain their own terms; the source-code license does not relicense those references.

Local marketing videos, supplied audio, store exports, and review captures are excluded from this repository. They are not part of the app's source distribution.
