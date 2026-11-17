import { loadAsync } from "expo-font";
import { LANGUAGE_FONTS } from "../constants/fonts";
import { createLanguageFontLoader } from "./languageFontLoader";

const loader = createLanguageFontLoader(async language => {
  try {
    await loadAsync(LANGUAGE_FONTS[language]);
  } catch (error) {
    console.warn(`Could not load ${language} fonts`, error);
    throw error;
  }
});

export const languageFontsReady = loader.ready;
export const loadLanguageFonts = loader.load;
