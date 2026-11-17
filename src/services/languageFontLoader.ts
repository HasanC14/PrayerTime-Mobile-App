import type { AppLanguage } from "../types";

export function createLanguageFontLoader(load: (language: Exclude<AppLanguage, "en">) => Promise<void>) {
  const completed = new Set<AppLanguage>();
  const failed = new Set<AppLanguage>();
  const pending = new Map<AppLanguage, Promise<void>>();
  return {
    ready: (language: AppLanguage) => language === "en" || completed.has(language) || failed.has(language),
    load(language: AppLanguage): Promise<void> {
      if (language === "en" || completed.has(language)) return Promise.resolve();
      const existing = pending.get(language);
      if (existing) return existing;
      const request = Promise.resolve().then(() => load(language)).then(() => {
        completed.add(language);
        failed.delete(language);
      }).catch(error => {
        // Allow the system fallback if a local font cannot be registered.
        failed.add(language);
        throw error;
      }).finally(() => pending.delete(language));
      pending.set(language, request);
      return request;
    }
  };
}
