import { COUNTRY_NAMES } from './countries';

/** Maps our dropdown labels to country-state-city country names when they differ. */
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  Fiji: 'Fiji Islands',
  'Hong Kong': 'Hong Kong S.A.R.',
  Macau: 'Macau S.A.R.',
};

type CountryStateCityModule = typeof import('country-state-city');

let cscModulePromise: Promise<CountryStateCityModule> | null = null;
let countryNameToIso: Map<string, string> | null = null;
const statesCache = new Map<string, string[]>();

function loadCountryStateCity(): Promise<CountryStateCityModule> {
  if (!cscModulePromise) {
    cscModulePromise = import('country-state-city');
  }
  return cscModulePromise;
}

async function ensureCountryMap(): Promise<Map<string, string>> {
  if (countryNameToIso) return countryNameToIso;

  const { Country } = await loadCountryStateCity();
  const cscCountries = Country.getAllCountries();
  const map = new Map<string, string>();

  for (const name of COUNTRY_NAMES) {
    const cscName = COUNTRY_NAME_ALIASES[name] ?? name;
    const match = cscCountries.find((country) => country.name === cscName);
    if (match) {
      map.set(name, match.isoCode);
    }
  }

  countryNameToIso = map;
  return map;
}

export async function getStatesForCountryAsync(countryName: string): Promise<string[]> {
  if (!countryName?.trim()) return [];

  const cached = statesCache.get(countryName);
  if (cached) return cached;

  const isoMap = await ensureCountryMap();
  const isoCode = isoMap.get(countryName);
  if (!isoCode) {
    statesCache.set(countryName, []);
    return [];
  }

  const { State } = await loadCountryStateCity();
  const states = State.getStatesOfCountry(isoCode)
    .map((state) => state.name)
    .sort((a, b) => a.localeCompare(b));

  statesCache.set(countryName, states);
  return states;
}

export function getCachedStatesForCountry(countryName: string): string[] {
  return statesCache.get(countryName) ?? [];
}

export function hasCachedStatesForCountry(countryName: string): boolean {
  return (statesCache.get(countryName)?.length ?? 0) > 0;
}

export function isValidStateForCountry(countryName: string, stateName: string, states?: string[]): boolean {
  const trimmedState = stateName.trim();
  if (!trimmedState) return false;

  const stateList = states ?? statesCache.get(countryName) ?? [];
  if (stateList.length === 0) return true;

  return stateList.some((state) => state.toLowerCase() === trimmedState.toLowerCase());
}

/** Preload states for a country (e.g. when the registration form opens). */
export function preloadStatesForCountry(countryName: string): void {
  void getStatesForCountryAsync(countryName);
}
