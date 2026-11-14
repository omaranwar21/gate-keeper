import en from './locales/en.json';
import ar from './locales/ar.json';

export const SUPPORTED_LOCALES = ['en', 'ar'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'en';

const catalogs: Record<SupportedLocale, Record<string, unknown>> = { en, ar };

/** Dotted path into the message catalogs, e.g. "guestPasses.notFound". */
export type MessageKey = string;

function resolve(catalog: Record<string, unknown>, key: MessageKey): string | undefined {
  const value: unknown = key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        typeof node === 'object' && node !== null
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      catalog,
    );
  return typeof value === 'string' ? value : undefined;
}

/** Translates a message key into the given locale. Falls back to English,
 * then to the raw key itself — so a string that isn't actually a catalog key
 * (e.g. a class-validator message) passes through unchanged, and a typo'd
 * key is visible instead of silently disappearing. */
export function translate(key: MessageKey, locale: SupportedLocale): string {
  return resolve(catalogs[locale], key) ?? resolve(catalogs[DEFAULT_LOCALE], key) ?? key;
}

/** Parses a `Content-Language` request header (e.g. "ar", "ar-EG") into one
 * of our supported locales, defaulting to English. */
export function parseContentLanguage(header: string | string[] | undefined): SupportedLocale {
  const value = Array.isArray(header) ? header[0] : header;
  const primary = value?.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(primary ?? '')
    ? (primary as SupportedLocale)
    : DEFAULT_LOCALE;
}
