export const INDIAN_LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी' },
] as const;

export type Language = (typeof INDIAN_LANGUAGES)[number]['code'];

export const FULLY_TRANSLATED_LANGUAGES = ['en', 'hi'] as const;

export type FullyTranslatedLanguage = (typeof FULLY_TRANSLATED_LANGUAGES)[number];

export function getLanguageLabel(code: Language): string {
  return INDIAN_LANGUAGES.find((lang) => lang.code === code)?.nativeName ?? 'English';
}
