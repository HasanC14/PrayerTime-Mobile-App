# Prayer hero illustration

`prayer-hero-mosque.png` is a 1536 × 1024 PNG with alpha transparency, generated with the built-in image generation tool. It is bundled locally; displaying it needs no network request. The original generated image is preserved in the generation output directory.

`HeroArtwork` layers the selected illustration over the existing lavender gradient with separate soft fades toward the countdown and footer. Dark appearance lowers the illustration's opacity. Arabic layouts mirror the composition so the clear area follows the text. Prayer guidance retains its warning colors without the decorative scene.

Settings → Display → Prayer card artwork offers Serenity (the original illustration), Mosque skyline (`prayer-hero-skyline.png`), and Moonlit palms (`prayer-hero-moonlit.png`). The latter two are 1774 × 887 PNGs with alpha channels, derived from the user's supplied references with the built-in image generation tool. All sample text, countdowns, progress bars, and card frames were removed from the references. Prayer information is rendered by the app. The images are bundled for offline use. The `heroArtwork` preference defaults to Moonlit palms when missing or invalid; valid saved choices are preserved.

The exact extraction prompts for the two additional styles are in [variant-prompts.md](variant-prompts.md).

## Final generation prompt

Use case: illustration-story.
Asset type: a production decorative transparent PNG illustration layered inside PrayerTime's mobile prayer countdown card.
Primary request: a beautiful softly painted lavender mosque at sunset, a large elegant onion dome with crescent finial and one slender minaret, a smaller dome, surrounded by airy soft clouds and atmospheric haze. A pale warm ivory-peach sunset glow behind the mosque, a delicate ivory crescent moon higher toward the middle, a few tiny restrained stars and three tiny distant birds. Calm, refined, minimal and polished, similar to a premium pastel Islamic prayer app illustration.
Composition: wide landscape 3:2 composition. Mosque occupies the right 55 percent; main dome around x=73 percent, minaret around x=90 percent. Architecture fully inside the image and visible, not clipped. Left 35 percent is mostly transparent negative space to accommodate live countdown text. Delicate wisps of clouds toward the lower left. Lowest 20 percent gently dissolves into transparent mist so live progress and next-prayer footer can remain readable. Left and upper edges fade softly to actual transparency, with no visible hard rectangular boundary. Crescent near x=54 percent in the upper half. No foreground building across the left.
Style: luminous editorial digital illustration, soft rounded architectural forms, subtle dimensional shading, smooth pastel gradients, no photorealism, no outlines, no harsh contrast, no busy ornament. Pale highlights and readable gentle purple shapes.
Palette: main lavender #CBB3D7 and #BFA5D4, soft lilac #E3D2F3, deeper lavender #A582C8 for architectural detail, soft ivory #FFF4DF and a very restrained peach glow. Blend beautifully over an app card gradient #E3D2F3 to #C5A7E2.
Background: actual alpha transparency surrounding and showing through the feathered scene; no opaque sky rectangle, no checkerboard drawn into the pixels.
Text: none. No lettering, no numbers, no interface, no card border, no phone frame, no logos, no watermark. This is only the artwork layer.
