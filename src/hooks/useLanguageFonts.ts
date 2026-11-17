import { useEffect, useReducer } from "react";
import type { AppLanguage } from "../types";
import { languageFontsReady, loadLanguageFonts } from "../services/appFonts";

export function useLanguageFonts(language: AppLanguage, restored: boolean): boolean {
  const [, redraw] = useReducer(value => value + 1, 0);
  useEffect(() => {
    if (!restored || languageFontsReady(language)) return;
    let active = true;
    void loadLanguageFonts(language).catch(() => undefined).then(() => {if (active) redraw();});
    return () => {active = false;};
  }, [language, restored]);
  return languageFontsReady(language);
}
