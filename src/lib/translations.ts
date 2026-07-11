import i18n from './i18n';
import { baseTranslations as translations } from './localeBase';
import { extendedTranslations, ExtendedTranslationStrings } from './localeExtended';
import { Language } from './languages';

export { translations };

export type TranslationStrings = (typeof translations)['en'] & ExtendedTranslationStrings;

const ALL_KEYS = [
  ...Object.keys(translations.en),
  ...Object.keys(extendedTranslations.en),
] as (keyof TranslationStrings)[];

type FullLang = keyof typeof translations;

function resolveStaticLang(language: Language): FullLang {
  if (language in extendedTranslations) {
    return language as FullLang;
  }
  return 'hi';
}

function staticTranslations(language: Language): TranslationStrings {
  const lang = resolveStaticLang(language);
  return {
    ...translations[lang],
    ...extendedTranslations[lang],
  } as TranslationStrings;
}

export function getTranslations(language: Language): TranslationStrings {
  if (!i18n.isInitialized) {
    return staticTranslations(language);
  }

  const fixedT = i18n.getFixedT(language);
  return new Proxy({} as TranslationStrings, {
    get(_target, prop: string) {
      if (prop in translations.en || prop in extendedTranslations.en) {
        return fixedT(prop);
      }
      return undefined;
    },
    ownKeys() {
      return ALL_KEYS;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop === 'string' && (prop in translations.en || prop in extendedTranslations.en)) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  });
}

export type { Language } from './languages';
