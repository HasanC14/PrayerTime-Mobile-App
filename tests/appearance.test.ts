import assert from "node:assert/strict";
import test from "node:test";
import { THEME_PALETTES, getArtworkHue, getArtworkOpacity, getWidgetAppearance, isDarkTheme, resolveThemeMode, type WidgetPalette } from "../src/constants/appearance";
import { THEME_OPTIONS, DEFAULT_SETTINGS, FALLBACK_LOCATION } from "../src/constants/settings";
import { validateSettings } from "../src/services/storage";
import { buildWidgetTimeline } from "../src/services/widgetTimeline";

const luminance = (color: string) => {
  const rgb = [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
const contrast = (a: string, b: string) => {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
};

test("widget detail text stays readable on tinted surfaces and progress tracks are opaque", () => {
  for (const option of THEME_OPTIONS) for (const palette of Object.values(getWidgetAppearance(option.id)).filter((value): value is WidgetPalette => typeof value === "object")) {
    for (const background of [palette.detailStart!, palette.detailEnd!]) for (const foreground of [palette.ink, palette.muted!, palette.accent])
      assert.ok(contrast(foreground, background) >= 4.5, `${option.id}: widget text ${foreground} on ${background}`);
    for (const track of [palette.track!, palette.dangerTrack!]) assert.match(track, /^#[0-9a-f]{6}$/i);
    assert.ok(contrast(palette.track!, palette.end) >= 1.3, `${option.id}: track must remain visible without a fill`);
    assert.ok(contrast(palette.dangerTrack!, palette.dangerEnd) >= 1.3);
  }
});

test("retired Sage selections migrate to the original light appearance", () => {
  const restored = validateSettings({...DEFAULT_SETTINGS, themeMode: "sage", language: "bn", timeFormat: "24h"});
  assert.equal(restored.themeMode, "light");
  assert.equal(restored.language, "bn");
  assert.equal(restored.timeFormat, "24h");
  assert.ok(!THEME_OPTIONS.some(option => String(option.id) === "sage"));
});

test("every appearance option survives storage and resolves correctly on either phone appearance", () => {
  for (const option of THEME_OPTIONS) {
    const restored = validateSettings(JSON.parse(JSON.stringify({...DEFAULT_SETTINGS, themeMode: option.id})));
    assert.equal(restored.themeMode, option.id);
    for (const systemDark of [false, true]) {
      const mode = resolveThemeMode(option.id, systemDark);
      assert.ok(THEME_PALETTES[mode]);
      if (option.id !== "system") assert.equal(mode, option.id);
      else assert.equal(isDarkTheme(mode), systemDark);
    }
  }
});

test("theme text and buttons retain readable contrast on their app backgrounds", () => {
  for (const [mode, palette] of Object.entries(THEME_PALETTES)) {
    for (const foreground of [palette.ink, palette.inkSoft, palette.accent]) {
      assert.ok(contrast(foreground, palette.surface) >= 4.5, `${mode}: ${foreground} on surface`);
      assert.ok(contrast(foreground, palette.background) >= 4.5, `${mode}: ${foreground} on background`);
    }
    assert.ok(contrast(palette.onPrimary, palette.primaryButton) >= 4.5, `${mode}: primary button`);
    assert.ok(contrast(palette.ink, palette.heroEnd) >= 4.5, `${mode}: hero text`);
  }
});

test("widget payload carries the matching palette and artwork hue for all appearances", () => {
  for (const option of THEME_OPTIONS) {
    const props = buildWidgetTimeline([], FALLBACK_LOCATION, {...DEFAULT_SETTINGS, themeMode: option.id})[0].props;
    assert.deepEqual(props.appearance, getWidgetAppearance(option.id));
    for (const systemDark of [false, true]) {
      const mode = resolveThemeMode(option.id, systemDark);
      const palette: WidgetPalette = props.appearance![props.appearance!.followsSystem && systemDark ? "dark" : "light"];
      assert.equal(palette.start, THEME_PALETTES[mode].heroStart);
      assert.equal(palette.end, THEME_PALETTES[mode].heroEnd);
      assert.equal(palette.dangerStart, THEME_PALETTES[mode].dangerHeroStart);
      assert.equal(palette.dangerEnd, THEME_PALETTES[mode].dangerHeroEnd);
      assert.equal(palette.dangerInk, THEME_PALETTES[mode].heroDanger);
      assert.equal(palette.dark, isDarkTheme(mode));
      assert.equal(palette.artworkHue, getArtworkHue(mode));
      assert.equal(palette.artworkOpacity, getArtworkOpacity(mode));
    }
  }
});

test("original brand appearances and natural illustration colours remain available", () => {
  assert.equal(DEFAULT_SETTINGS.themeMode, "light");
  assert.equal(THEME_PALETTES.light.heroStart, "#E3D2F3");
  assert.equal(THEME_PALETTES.light.heroEnd, "#C5A7E2");
  assert.equal(THEME_PALETTES.light.accent, "#6F4B94");
  assert.equal(THEME_PALETTES["classic-dark"].heroStart, "#3C2850");
  assert.equal(THEME_PALETTES["classic-dark"].heroEnd, "#60417C");
  for (const option of THEME_OPTIONS) {
    const mode = resolveThemeMode(option.id, false);
    assert.equal(getArtworkHue(mode), 0, `${mode} should preserve the illustration's pigments`);
    assert.ok(getArtworkOpacity(mode) > 0 && getArtworkOpacity(mode) <= 1);
  }
});

test("prohibited periods use each theme's own muted palette with readable text", () => {
  const customModes = ["sand", "rose", "midnight-blue", "classic-dark"] as const;
  const gradients = new Set<string>();
  for (const mode of customModes) {
    const palette = THEME_PALETTES[mode];
    const inherited = THEME_PALETTES[isDarkTheme(mode) ? "dark" : "light"];
    assert.notEqual(palette.dangerHeroStart, inherited.dangerHeroStart, `${mode} must not inherit the original prohibited palette`);
    assert.notEqual(palette.dangerHeroEnd, inherited.dangerHeroEnd);
    assert.notEqual(palette.dangerHeroStart, palette.heroStart, `${mode} should distinguish prohibited periods`);
    gradients.add(`${palette.dangerHeroStart}:${palette.dangerHeroEnd}`);
  }
  assert.equal(gradients.size, customModes.length);
  for (const [mode, palette] of Object.entries(THEME_PALETTES)) {
    for (const background of [palette.dangerHeroStart, palette.dangerHeroEnd]) {
      for (const foreground of [palette.heroDanger, palette.dangerHeroMuted]) {
        assert.ok(contrast(foreground, background) >= 4.5, `${mode}: prohibited text ${foreground} on ${background}`);
      }
    }
  }
});
