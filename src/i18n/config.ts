/**
 * Centralized i18n configuration.
 *
 * Single source of truth for the locales supported by the portal. It is consumed by:
 *   - the next-intl routing definition (routing.ts)
 *   - the request configuration (request.ts)
 *   - the <html lang dir> attributes set in the locale layout
 *   - the language switcher in the navbar
 */

export const locales = ['fr', 'en', 'de', 'it', 'la', 'el', 'ar', 'zh'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

/** Human-readable labels, each shown in its own language (autonyms). */
export const localeLabels: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  la: 'Latina',
  el: 'Ελληνικά',
  ar: 'العربية',
  zh: '中文',
};

/** Locales rendered right-to-left. */
export const rtlLocales: readonly Locale[] = ['ar'];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDirection(locale: string): 'ltr' | 'rtl' {
  return rtlLocales.includes(locale as Locale) ? 'rtl' : 'ltr';
}
