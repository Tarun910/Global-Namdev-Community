import fs from 'fs';

const srcPath = 'src/lib/translations.ts';
const src = fs.readFileSync(srcPath, 'utf8');
const start = src.indexOf('export const translations = {');
const end = src.indexOf('\n};', start) + 3;
const block = src.slice(start, end).replace('export const translations', 'export const baseTranslations');
fs.writeFileSync('src/lib/localeBase.ts', block + '\n');

const newTranslations = `import i18n from './i18n';
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

function staticTranslations(language: Language): TranslationStrings {
  const lang = (language in translations ? language : 'en') as FullLang;
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
`;

fs.writeFileSync(srcPath, newTranslations);
console.log('Created localeBase.ts and updated translations.ts');
