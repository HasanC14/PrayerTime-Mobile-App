import type { ThemeMode } from "../types";

export const lightColors = {
  ink: "#24143A",
  inkSoft: "#746A7D",
  accent: "#6F4B94",
  accentPressed: "#583B78",
  onAccent: "#FFFFFF",
  primaryButton: "#24143A",
  onPrimary: "#FFFFFF",
  accentSurface: "#F1E5F5",
  white: "#FFFFFF",
  background: "#F6F4F8",
  backgroundTint: "#F1E6FA",
  surface: "#FFFFFF",
  surfaceMuted: "#F4EEF8",
  selectedSurface: "#F1E8F7",
  border: "#ECE5F1",
  borderStrong: "#D9CBE4",
  heroStart: "#E3D2F3",
  heroEnd: "#C5A7E2",
  heroMuted: "#503E5D",
  heroTrack: "rgba(255,255,255,0.48)",
  warningSurface: "#FFF7E8",
  warningBorder: "#E9C978",
  warningText: "#6D5220",
  danger: "#B33A3A",
  heroDanger: "#514C5B",
  dangerHeroStart: "#E7E4EA",
  dangerHeroEnd: "#D8D4DE",
  dangerHeroMuted: "#615A6A",
  dangerHeroTrack: "rgba(255,255,255,0.52)",
  dangerSurface: "#FCEAEA",
  success: "#2E7653",
  successSurface: "#E9F6EF",
  sheetHandle: "#D8CDDD",
  muted: "#B8AFBE",
  mutedStrong: "#CFC7D4",
  compassSurface: "#F4ECFA",
  compassBorder: "#D8C4E8",
  compassTicks: "#BFA6D6",
  compassTail: "#CDB8DE",
  backdrop: "rgba(29, 17, 45, 0.38)"
} as const;

export const darkColors: ThemeColors = {
  ink: "#EEEAF2",
  inkSoft: "#BBB5C4",
  accent: "#C0ACD7",
  accentPressed: "#D2BFE6",
  onAccent: "#24202E",
  primaryButton: "#C0ACD7",
  onPrimary: "#24202E",
  accentSurface: "#332E40",
  white: "#FFFFFF",
  background: "#18191E",
  backgroundTint: "#22212A",
  surface: "#222329",
  surfaceMuted: "#2B2B33",
  selectedSurface: "#35303F",
  border: "#34343E",
  borderStrong: "#575260",
  heroStart: "#30303C",
  heroEnd: "#414052",
  heroMuted: "#CEC4DA",
  heroTrack: "rgba(228,225,232,0.18)",
  warningSurface: "#39332A",
  warningBorder: "#88714D",
  warningText: "#E0C28F",
  danger: "#E6A29E",
  heroDanger: "#D9D2E2",
  dangerHeroStart: "#292930",
  dangerHeroEnd: "#34323D",
  dangerHeroMuted: "#BEB6C9",
  dangerHeroTrack: "rgba(217,210,226,0.18)",
  dangerSurface: "#3C3031",
  success: "#9AC8B0",
  successSurface: "#2C3933",
  sheetHandle: "#696570",
  muted: "#85808D",
  mutedStrong: "#625D6A",
  compassSurface: "#2D2B37",
  compassBorder: "#544A64",
  compassTicks: "#82738F",
  compassTail: "#9D8BAD",
  backdrop: "rgba(12, 13, 16, 0.48)"
};

// Original palette, offered separately from the softer dark appearance.
// Prohibited periods use a quieter shade of each theme's own colour family.
export const classicDarkColors: ThemeColors = {
  ...darkColors,
  ink: "#F7F0FB", inkSoft: "#BBAFC5", accent: "#C39BE5", accentPressed: "#D4B3EF",
  onAccent: "#1A1022", primaryButton: "#7C54A1", onPrimary: "#FFFFFF",
  accentSurface: "#352446", background: "#100B16", backgroundTint: "#21142E",
  surface: "#1C1425", surfaceMuted: "#2A1E35", selectedSurface: "#332244",
  border: "#34263F", borderStrong: "#4D395B", heroStart: "#3C2850", heroEnd: "#60417C",
  heroMuted: "#D6C3E3", heroTrack: "rgba(255,255,255,0.24)",
  heroDanger: "#DED0EA", dangerHeroStart: "#2B2037", dangerHeroEnd: "#3B2B4A",
  dangerHeroMuted: "#C8B8D6", dangerHeroTrack: "rgba(222,208,234,0.18)",
  warningSurface: "#352B18", warningBorder: "#7D6630", warningText: "#F1D38A",
  danger: "#FF9696", dangerSurface: "#391D22", success: "#7AD6A6", successSurface: "#173526",
  sheetHandle: "#63536E", muted: "#716678", mutedStrong: "#574C60",
  compassSurface: "#261A31", compassBorder: "#4D365F", compassTicks: "#70528A", compassTail: "#806497",
  backdrop: "rgba(0, 0, 0, 0.55)"
};

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

export const sandColors: ThemeColors = {
  ...lightColors, ink: "#362D3E", inkSoft: "#716575", accent: "#715878", accentPressed: "#5A4261",
  primaryButton: "#49364F", accentSurface: "#EEE5EC", background: "#FAF6F0", backgroundTint: "#F1EAE4",
  surface: "#FFFCF8", surfaceMuted: "#F2EDE7", selectedSurface: "#EEE5EC", border: "#E9E2DB", borderStrong: "#D4C8D1",
  heroStart: "#F0E8E5", heroEnd: "#DCD0E3", heroMuted: "#63546D", heroTrack: "rgba(255,255,255,0.50)",
  heroDanger: "#5E535F", dangerHeroStart: "#EDE8E2", dangerHeroEnd: "#DDD6D2",
  dangerHeroMuted: "#62565F", dangerHeroTrack: "rgba(94,83,95,0.12)",
  compassSurface: "#F0E9E9", compassBorder: "#D5C7D4", compassTicks: "#AF9DB3", compassTail: "#C2AEC7",
  sheetHandle: "#D6C5A9", muted: "#BAAE99", mutedStrong: "#D2C7B4", backdrop: "rgba(55, 39, 24, 0.38)"
};
export const roseColors: ThemeColors = {
  ...lightColors, ink: "#3E2E40", inkSoft: "#766177", accent: "#805B7F", accentPressed: "#654665",
  primaryButton: "#543852", accentSurface: "#F0E5ED", background: "#FBF7F9", backgroundTint: "#F2E9F0",
  surface: "#FFFCFE", surfaceMuted: "#F5EEF3", selectedSurface: "#EEE0EB", border: "#EAE1E8", borderStrong: "#D8C4D5",
  heroStart: "#EEDFE9", heroEnd: "#D8C5DD", heroMuted: "#66506C", heroTrack: "rgba(255,255,255,0.50)",
  heroDanger: "#655266", dangerHeroStart: "#EBE4E9", dangerHeroEnd: "#DDD2DD",
  dangerHeroMuted: "#655267", dangerHeroTrack: "rgba(101,82,102,0.12)",
  compassSurface: "#F1E7EF", compassBorder: "#D7C3D5", compassTicks: "#B89AB8", compassTail: "#C6ACCA",
  sheetHandle: "#DDC1CB", muted: "#C1AAB4", mutedStrong: "#D8C2CB", backdrop: "rgba(54, 29, 39, 0.38)"
};
export const midnightBlueColors: ThemeColors = {
  ...darkColors, ink: "#EAEAF4", inkSoft: "#B8B9CD", accent: "#B8B8E1", accentPressed: "#D0C9ED",
  onAccent: "#23243B", primaryButton: "#B8B8E1", onPrimary: "#23243B", accentSurface: "#2D3047",
  background: "#151B29", backgroundTint: "#202638", surface: "#202737", surfaceMuted: "#293044", selectedSurface: "#34384F",
  border: "#333B50", borderStrong: "#575D78", heroStart: "#2B3148", heroEnd: "#403F5C", heroMuted: "#CBC6E0",
  heroDanger: "#D7D8E7", dangerHeroStart: "#252C3D", dangerHeroEnd: "#34384D",
  dangerHeroMuted: "#BEC2D8", dangerHeroTrack: "rgba(215,216,231,0.18)",
  compassSurface: "#2A2E44", compassBorder: "#545975", compassTicks: "#8186A8", compassTail: "#9B9FBF",
  sheetHandle: "#536D87", muted: "#7B90A5", mutedStrong: "#536B83", backdrop: "rgba(6, 14, 23, 0.52)"
};
export type ResolvedThemeMode = Exclude<ThemeMode, "system">;
export const THEME_PALETTES: Record<ResolvedThemeMode, ThemeColors> = {
  light: lightColors, dark: darkColors, "classic-dark": classicDarkColors,
  sand: sandColors, rose: roseColors, "midnight-blue": midnightBlueColors
};
export const isDarkTheme = (mode: ResolvedThemeMode) => mode === "dark" || mode === "classic-dark" || mode === "midnight-blue";
export const resolveThemeMode = (mode: ThemeMode, systemDark: boolean): ResolvedThemeMode => mode === "system" ? systemDark ? "dark" : "light" : mode;
// The illustrations retain their original lavender and ivory pigments in every theme.
// Keep the hue field in widget payloads for compatibility with installed widgets.
export function getArtworkHue(_mode: ResolvedThemeMode): number { return 0; }
export function getArtworkOpacity(mode: ResolvedThemeMode): number {
  return mode === "classic-dark" ? .30 : isDarkTheme(mode) ? .36
    : mode === "sand" ? .76 : mode === "rose" ? .78 : .94;
}

export interface WidgetPalette {
  ink: string; accent: string; start: string; end: string;
  surface?: string; muted?: string; heroMuted?: string; line?: string; highlight?: string; track?: string;
  detailStart?: string; detailEnd?: string; detailArtworkOpacity?: number; dangerTrack?: string;
  dangerInk: string; dangerStart: string; dangerEnd: string;
  artworkHue: number; artworkOpacity: number; dark: boolean;
}
// Widget backgrounds use the same pigments as the app, with enough colour to
// read as part of the selected appearance even on a busy home screen.
export function blendWidgetColor(first: string, second: string, amount: number): string {
  const channel = (offset: number) => Math.round(parseInt(first.slice(offset, offset + 2), 16) * (1 - amount)
    + parseInt(second.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, "0");
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}
function widgetPalette(mode: ResolvedThemeMode): WidgetPalette {
  const colors = THEME_PALETTES[mode];
  return {ink: colors.ink, accent: colors.accent, start: colors.heroStart, end: colors.heroEnd,
    surface: colors.surface, muted: blendWidgetColor(colors.inkSoft, colors.ink, .12), heroMuted: colors.heroMuted, line: colors.border, highlight: colors.selectedSurface,
    track: blendWidgetColor(colors.heroEnd, colors.accent, .32),
    dangerTrack: blendWidgetColor(colors.dangerHeroEnd, colors.heroDanger, .25),
    detailStart: blendWidgetColor(colors.surface, colors.heroStart, .44),
    detailEnd: blendWidgetColor(colors.surface, colors.heroEnd, .28),
    detailArtworkOpacity: isDarkTheme(mode) ? .34 : .55,
    dangerInk: colors.heroDanger, dangerStart: colors.dangerHeroStart, dangerEnd: colors.dangerHeroEnd,
    artworkHue: getArtworkHue(mode), artworkOpacity: getArtworkOpacity(mode), dark: isDarkTheme(mode)};
}
export function getWidgetAppearance(mode: ThemeMode) {
  return {followsSystem: mode === "system", light: widgetPalette(resolveThemeMode(mode, false)), dark: widgetPalette(resolveThemeMode(mode, true))};
}
