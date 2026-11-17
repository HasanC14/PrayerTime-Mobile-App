import { useI18n } from "./i18n/context";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Platform, useColorScheme } from "react-native";

import type { ThemeMode } from "./types";

import { lightColors, THEME_PALETTES, isDarkTheme, resolveThemeMode, type ThemeColors, type ResolvedThemeMode } from "./constants/appearance";
export { lightColors, darkColors, classicDarkColors } from "./constants/appearance";
export type { ThemeColors } from "./constants/appearance";

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  resolvedMode: ResolvedThemeMode;
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  resolvedMode: "light"
});

export function AppThemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const systemScheme = useColorScheme();
  const resolvedMode = resolveThemeMode(mode, systemScheme === "dark");
  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: THEME_PALETTES[resolvedMode],
      isDark: isDarkTheme(resolvedMode),
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
  const themed = Object.entries(THEME_PALETTES).map(([mode, colors]) => [mode, factory(colors)] as const);
  const makeStyles = (rtl: boolean) => Object.fromEntries(themed.map(([mode, styles]) =>
    [mode, forDirection(styles, rtl)])) as Record<ResolvedThemeMode, Styles>;
  const directional = {ltr: makeStyles(false), rtl: makeStyles(true)};
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
