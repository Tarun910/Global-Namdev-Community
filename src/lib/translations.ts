import i18n from './i18n';
import { localeStrings, TranslationStrings } from './localeStrings';
import { Language } from './languages';

export { localeStrings as translations };

export type { TranslationStrings };

const ALL_KEYS = Object.keys(localeStrings.en) as (keyof TranslationStrings)[];

type FullLang = keyof typeof localeStrings;

function resolveStaticLang(language: Language): FullLang {
  if (language in localeStrings) {
    return language as FullLang;
  }
  return 'hi';
}

function staticTranslations(language: Language): TranslationStrings {
  const lang = resolveStaticLang(language);
  return localeStrings[lang];
}

export function getTranslations(language: Language): TranslationStrings {
  if (!i18n.isInitialized) {
    return staticTranslations(language);
  }

  const fixedT = i18n.getFixedT(language);
  return new Proxy({} as TranslationStrings, {
    get(_target, prop: string) {
      if (prop in localeStrings.en) {
        return fixedT(prop);
      }
      return undefined;
    },
    ownKeys() {
      return ALL_KEYS;
    },
    getOwnPropertyDescriptor(_target, prop) {
      if (typeof prop === 'string' && prop in localeStrings.en) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  });
}

export type { Language } from './languages';
