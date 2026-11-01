import { useI18n } from "./i18n/context";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useColorScheme } from "react-native";

import type { ThemeMode } from "./types";

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
  ink: "#E4E1E8",
  inkSoft: "#B4AFBC",
  accent: "#B5A2CC",
  accentPressed: "#C4B4D6",
  onAccent: "#24212B",
  primaryButton: "#B5A2CC",
  onPrimary: "#24212B",
  accentSurface: "#39353F",
  white: "#FFFFFF",
  background: "#202125",
  backgroundTint: "#25262B",
  surface: "#292A2F",
  surfaceMuted: "#303137",
  selectedSurface: "#3B3743",
  border: "#3A3B43",
  borderStrong: "#56535F",
  heroStart: "#35323D",
  heroEnd: "#464050",
  heroMuted: "#C5BECE",
  heroTrack: "rgba(228,225,232,0.18)",
  warningSurface: "#39332A",
  warningBorder: "#88714D",
  warningText: "#E0C28F",
  danger: "#E6A29E",
  heroDanger: "#C9C4D1",
  dangerHeroStart: "#303035",
  dangerHeroEnd: "#3B393F",
  dangerHeroMuted: "#B4AFBC",
  dangerHeroTrack: "rgba(201,196,209,0.18)",
  dangerSurface: "#3C3031",
  success: "#9AC8B0",
  successSurface: "#2C3933",
  sheetHandle: "#696570",
  muted: "#85808D",
  mutedStrong: "#625D6A",
  compassSurface: "#323039",
  compassBorder: "#57505F",
  compassTicks: "#8B7E9A",
  compassTail: "#9A8BA9",
  backdrop: "rgba(12, 13, 16, 0.48)"
};

// Original palette, offered separately from the softer dark appearance.
// Keep the current neutral prohibited-time treatment in both dark themes.
export const classicDarkColors: ThemeColors = {
  ...darkColors,
  ink: "#F7F0FB", inkSoft: "#BBAFC5", accent: "#C39BE5", accentPressed: "#D4B3EF",
  onAccent: "#1A1022", primaryButton: "#7C54A1", onPrimary: "#FFFFFF",
  accentSurface: "#352446", background: "#100B16", backgroundTint: "#21142E",
  surface: "#1C1425", surfaceMuted: "#2A1E35", selectedSurface: "#332244",
  border: "#34263F", borderStrong: "#4D395B", heroStart: "#3C2850", heroEnd: "#60417C",
  heroMuted: "#D6C3E3", heroTrack: "rgba(255,255,255,0.24)",
  warningSurface: "#352B18", warningBorder: "#7D6630", warningText: "#F1D38A",
  danger: "#FF9696", dangerSurface: "#391D22", success: "#7AD6A6", successSurface: "#173526",
  sheetHandle: "#63536E", muted: "#716678", mutedStrong: "#574C60",
  compassSurface: "#261A31", compassBorder: "#4D365F", compassTicks: "#70528A", compassTail: "#806497",
  backdrop: "rgba(0, 0, 0, 0.55)"
};

export type ThemeColors = { [Key in keyof typeof lightColors]: string };

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  resolvedMode: Exclude<ThemeMode, "system">;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  resolvedMode: "light"
});

export function AppThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const systemScheme = useColorScheme();
  const resolvedMode = mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: resolvedMode === "classic-dark" ? classicDarkColors : resolvedMode === "dark" ? darkColors : lightColors,
      isDark: resolvedMode !== "light",
      resolvedMode
    }),
    [resolvedMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

export function createThemedStyles<Styles>(factory: (colors: ThemeColors) => Styles) {
  const lightStyles = factory(lightColors);
  const darkStyles = factory(darkColors);
  const classicDarkStyles = factory(classicDarkColors);
  // React Native Web resolves start/end against the device direction. Resolve
  // them here so an in-app language change also updates physical spacing.
  const forDirection = (styles: Styles, rtl: boolean): Styles => Platform.OS !== "web" ? styles : Object.fromEntries(
    Object.entries(styles as Record<string, object>).map(([name, style]) => [name, Object.fromEntries(
      Object.entries(style).map(([key, value]) => {
        const logical = key.match(/^(margin|padding)?(Start|End)$/) ?? key.match(/^(start|end)$/);
        if (!logical) return [key, value];
        const prefix = logical.length === 3 ? logical[1] ?? "" : "";
        const start = key.toLowerCase().endsWith("start");
        const side = start !== rtl ? "Left" : "Right";
        return [prefix ? prefix + side : side.toLowerCase(), value];
      })
    )])
  ) as Styles;
  const directional = { ltr: { light: forDirection(lightStyles, false), dark: forDirection(darkStyles, false), "classic-dark": forDirection(classicDarkStyles, false) }, rtl: { light: forDirection(lightStyles, true), dark: forDirection(darkStyles, true), "classic-dark": forDirection(classicDarkStyles, true) } };
  return function useThemedStyles(): { colors: ThemeColors; styles: Styles; isDark: boolean; resolvedMode: ThemeContextValue["resolvedMode"] } {
    const theme = useAppTheme();
    const { isRTL } = useI18n();
    return {
      colors: theme.colors,
      styles: directional[isRTL ? "rtl" : "ltr"][theme.resolvedMode],
      isDark: theme.isDark,
      resolvedMode: theme.resolvedMode
    };
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  sheet: 28,
  pill: 999
} as const;

export const shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.035,
    shadowRadius: 8,
    elevation: 0
  },
  hero: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8
  }
} as const;
