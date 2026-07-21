export type Locale = "en" | "zhHans";

export const LOCALES: readonly Locale[] = ["en", "zhHans"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "febh.locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  zhHans: "简体中文",
};

// BCP 47 tags for the document `lang` attribute.
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en",
  zhHans: "zh-Hans",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zhHans";
}

export function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore write failures (e.g. private browsing quota errors).
  }
}
