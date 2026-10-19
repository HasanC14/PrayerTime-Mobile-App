import type { AppLanguage } from "../types";
import { messages } from "./messages";

export const languageOptions = [
  { id: "en", name: "English" },
  { id: "bn", name: "বাংলা" },
  { id: "ar", name: "العربية" }
] as const;

export const locales: Record<AppLanguage, string> = { en: "en-US", bn: "bn-BD-u-nu-beng", ar: "ar-u-nu-arab" };
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
const normalized = new Map(Object.entries(messages).map(([key, value]) => [normalize(key).toLowerCase(), value]));
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const templates = Object.entries(messages).filter(([key]) => /\{\w+\}/.test(key)).map(([source, translations]) => {
  const keys: string[] = [];
  let expression = "";
  let end = 0;
  for (const match of source.matchAll(/\{(\w+)\}/g)) {
    expression += escape(source.slice(end, match.index)) + (["minutes", "hours", "meters", "kilometers", "degrees", "day", "year"].includes(match[1]) ? "([0-9০-৯٠-٩۰-۹.,−+]+)" : "(.+?)");
    keys.push(match[1]);
    end = match.index + match[0].length;
  }
  return { source, translations, keys, regex: new RegExp("^" + expression + escape(source.slice(end)) + "$", "i") };
}).sort((a, b) => b.source.replace(/\{\w+\}/g, "").length - a.source.replace(/\{\w+\}/g, "").length);

export function localizeDigits(text: string | number, language: AppLanguage): string {
  const digits = language === "bn" ? "০১২৩৪৫৬৭৮৯" : language === "ar" ? "٠١٢٣٤٥٦٧٨٩" : "0123456789";
  return String(text).replace(/[0-9]/g, digit => digits[Number(digit)]);
}

export function normalizeDigits(text: string): string {
  return text.replace(/[০-৯٠-٩۰-۹]/g, digit => String("০১২৩৪৫৬৭৮৯".indexOf(digit) >= 0 ? "০১২৩৪৫৬৭৮৯".indexOf(digit) : "٠١٢٣٤٥٦٧٨٩".indexOf(digit) >= 0 ? "٠١٢٣٤٥٦٧٨٩".indexOf(digit) : "۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

export function translateMessage(source: string, language: AppLanguage, params?: Record<string, string | number>, depth = 0): string {
  if (params) {
    const translated = language === "en" ? source : normalized.get(normalize(source).toLowerCase())?.[language === "bn" ? 0 : 1] ?? source;
    return localizeDigits(translated.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
      params[key] === undefined ? placeholder : translateMessage(String(params[key]), language, undefined, depth + 1)), language);
  }
  if (language === "en") return source;
  const key = normalize(source);
  const direct = normalized.get(key.toLowerCase());
  if (direct) {
    const leading = source.match(/^\s*/)?.[0] ?? "";
    const trailing = source.match(/\s*$/)?.[0] ?? "";
    return localizeDigits(leading + direct[language === "bn" ? 0 : 1] + trailing, language);
  }
  if (depth < 4) {
    for (const template of templates) {
      const match = key.match(template.regex);
      if (!match) continue;
      const values = Object.fromEntries(template.keys.map((name, index) => [name, match[index + 1]]));
      return localizeDigits(template.translations[language === "bn" ? 0 : 1].replace(/\{(\w+)\}/g, (_, name: string) =>
        translateMessage(values[name] ?? "", language, undefined, depth + 1)), language);
    }
  }
  return localizeDigits(source, language);
}

export function weekdayShort(day: string, language: AppLanguage): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const index = days.indexOf(day);
  return (language === "bn" ? ["সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি", "রবি"]
    : language === "ar" ? ["ن", "ث", "ر", "خ", "ج", "س", "ح"] : ["M", "T", "W", "T", "F", "S", "S"])[index] ?? day;
}
