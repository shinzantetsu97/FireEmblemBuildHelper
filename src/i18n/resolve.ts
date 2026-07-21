import type { Locale } from "./locale";
import { en, type MessageKey } from "./messages/en";
import { zhHans } from "./messages/zhHans";

// A localized string bag: `en` is required, other locales optional so that
// data can be filled in incrementally without breaking rendering.
export type LocalizedText = { en: string } & Partial<Record<Locale, string>>;

const catalogs: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  zhHans,
};

// Resolve a localized data string, falling back to English then to `fallback`.
export function resolveName(
  names: LocalizedText | undefined,
  locale: Locale,
  fallback = "",
): string {
  if (!names) {
    return fallback;
  }

  return names[locale] ?? names.en ?? fallback;
}

// Resolve a UI-chrome message, falling back to English then to the raw key.
// Supports `{name}`-style placeholder interpolation.
export function translate(
  key: MessageKey,
  locale: Locale,
  params?: Record<string, string | number>,
): string {
  const template = catalogs[locale][key] ?? en[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
