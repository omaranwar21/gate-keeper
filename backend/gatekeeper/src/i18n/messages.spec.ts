import { parseContentLanguage, translate } from './messages';

describe('translate', () => {
  it('translates a known key into the requested locale', () => {
    expect(translate('guestPasses.notFound', 'ar')).toBe('التصريح غير موجود');
    expect(translate('guestPasses.notFound', 'en')).toBe('Pass not found');
  });

  it('returns the raw key unchanged when it is not in any catalog', () => {
    // Covers both a typo'd key and a non-key message (e.g. a class-validator
    // default) being passed through rather than silently disappearing.
    expect(translate('nonexistent.key', 'ar')).toBe('nonexistent.key');
    expect(translate('email must be an email', 'ar')).toBe('email must be an email');
  });
});

describe('parseContentLanguage', () => {
  it('maps a supported primary tag to that locale', () => {
    expect(parseContentLanguage('ar')).toBe('ar');
    expect(parseContentLanguage('ar-EG')).toBe('ar');
    expect(parseContentLanguage('en-US')).toBe('en');
  });

  it('defaults to English for missing, empty, or unsupported headers', () => {
    expect(parseContentLanguage(undefined)).toBe('en');
    expect(parseContentLanguage('')).toBe('en');
    expect(parseContentLanguage('fr')).toBe('en');
  });

  it('takes the first value of a multi-value header', () => {
    expect(parseContentLanguage(['ar', 'en'])).toBe('ar');
    expect(parseContentLanguage('ar, en')).toBe('ar');
  });
});
