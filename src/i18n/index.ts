import { en } from "./locales/en.js";
import { zh } from "./locales/zh.js";
export * from "./types.js";
import type { Locale, TranslationKeys } from "./types.js";

const locales: Record<Locale, TranslationKeys> = {
  en,
  zh,
};

export function getTranslations(locale: Locale | string = "en"): TranslationKeys {
  if (locale === "zh") {
    return locales.zh;
  }
  return locales.en;
}

export function interpolate(
  template: string,
  params: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}
