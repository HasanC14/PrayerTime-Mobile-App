import { createContext, useContext, useMemo, type ReactNode } from "react";
import { View } from "react-native";
import type { AppLanguage } from "../types";
import { locales, localizeDigits, translateMessage } from "./translate";

const createLocale = (language: AppLanguage, setLanguage: (language: AppLanguage) => void) => ({
  language,
  locale: locales[language],
  isRTL: language === "ar",
  setLanguage,
  t: (text: string, params?: Record<string, string | number>) => translateMessage(text, language, params),
  n: (value: string | number) => localizeDigits(value, language)
});
const I18nContext = createContext(createLocale("en", () => undefined));

export function I18nProvider({ language, onChangeLanguage, children }: { language: AppLanguage; onChangeLanguage: (language: AppLanguage) => void; children: ReactNode }) {
  const value = useMemo(() => createLocale(language, onChangeLanguage), [language, onChangeLanguage]);
  return <I18nContext.Provider value={value}>
    <View style={{ flex: 1, direction: value.isRTL ? "rtl" : "ltr" }}>{children}</View>
  </I18nContext.Provider>;
}

export function useI18n() { return useContext(I18nContext); }
