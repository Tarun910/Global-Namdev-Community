import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { localeStrings } from './localeStrings';
import { FULLY_TRANSLATED_LANGUAGES, INDIAN_LANGUAGES, Language } from './languages';

export const LANG_STORAGE_KEY = 'gnc_language';

type FullLang = (typeof FULLY_TRANSLATED_LANGUAGES)[number];

function buildResources() {
  const resources: Record<string, { translation: Record<string, string> }> = {};

  for (const lang of FULLY_TRANSLATED_LANGUAGES) {
    resources[lang] = { translation: { ...localeStrings[lang] } };
  }

  return resources;
}

export function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && INDIAN_LANGUAGES.some((lang) => lang.code === stored)) {
      return stored as Language;
    }
  } catch {
    /* ignore storage errors */
  }
  return null;
}

export function persistLanguage(lang: Language) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* ignore storage errors */
  }
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: buildResources(),
    lng: getStoredLanguage() ?? 'hi',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function changeAppLanguage(lang: Language) {
  persistLanguage(lang);
  return i18n.changeLanguage(lang);
}

export default i18n;
