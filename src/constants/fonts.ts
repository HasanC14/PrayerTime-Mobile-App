import type { AppLanguage } from "../types";
import { BricolageGrotesque_400Regular } from "@expo-google-fonts/bricolage-grotesque/400Regular";
import { BricolageGrotesque_500Medium } from "@expo-google-fonts/bricolage-grotesque/500Medium";
import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";

import { AnekBangla_400Regular } from "@expo-google-fonts/anek-bangla/400Regular";
import { AnekBangla_500Medium } from "@expo-google-fonts/anek-bangla/500Medium";
import { AnekBangla_600SemiBold } from "@expo-google-fonts/anek-bangla/600SemiBold";
import { AnekBangla_700Bold } from "@expo-google-fonts/anek-bangla/700Bold";
import { AnekBangla_800ExtraBold } from "@expo-google-fonts/anek-bangla/800ExtraBold";
import { Tajawal_400Regular } from "@expo-google-fonts/tajawal/400Regular";
import { Tajawal_500Medium } from "@expo-google-fonts/tajawal/500Medium";
import { Tajawal_700Bold } from "@expo-google-fonts/tajawal/700Bold";
import { Tajawal_800ExtraBold } from "@expo-google-fonts/tajawal/800ExtraBold";

export const ENGLISH_FONTS = {
  BricolageGrotesque_400Regular, BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold
};
export const LANGUAGE_FONTS: Record<Exclude<AppLanguage, "en">, Record<string, number>> = {
  bn: {AnekBangla_400Regular, AnekBangla_500Medium, AnekBangla_600SemiBold, AnekBangla_700Bold, AnekBangla_800ExtraBold},
  ar: {Tajawal_400Regular, Tajawal_500Medium, Tajawal_700Bold, Tajawal_800ExtraBold}
};
