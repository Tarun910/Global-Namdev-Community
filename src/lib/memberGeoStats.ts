import { Registration } from '../types';

export interface StateLocationStat {
  name: string;
  count: number;
}

export interface StateStat {
  members: number;
  districts: StateLocationStat[];
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function normalizeCountry(country: string | undefined): string {
  const raw = (country ?? '').trim();
  if (!raw) return 'India';

  const lower = raw.toLowerCase();
  if (lower === 'usa' || lower === 'u.s.a.' || lower === 'us' || lower === 'united states') {
    return 'United States';
  }
  if (lower === 'uk' || lower === 'u.k.' || lower === 'united kingdom') {
    return 'United Kingdom';
  }

  return titleCase(raw);
}

export function normalizeState(state: string): string {
  return titleCase(state);
}

export function isIndiaRegistration(registration: Registration): boolean {
  const country = (registration.country ?? '').trim().toLowerCase();
  return country === 'india' || country === 'in' || country === '';
}

export function buildWorldStats(registrations: Registration[]): Record<string, number> {
  const counts: Record<string, number> = {};

  registrations.forEach((registration) => {
    const country = normalizeCountry(registration.country);
    counts[country] = (counts[country] || 0) + 1;
  });

  return counts;
}

export function buildCountryRegionStats(
  registrations: Registration[],
  countryName: string
): Record<string, StateStat> {
  const stats: Record<string, StateStat> = {};
  const normalizedCountry = normalizeCountry(countryName);

  registrations.forEach((registration) => {
    if (normalizeCountry(registration.country) !== normalizedCountry) return;

    const stateName = registration.state?.trim();
    if (!stateName) return;

    const normalizedState = normalizeState(stateName);
    if (!stats[normalizedState]) {
      stats[normalizedState] = { members: 0, districts: [] };
    }

    stats[normalizedState].members += 1;

    const locationName = registration.district?.trim()
      || registration.city?.trim()
      || 'Unspecified';

    const normalizedLocation = titleCase(locationName);
    const existing = stats[normalizedState].districts.find(
      (entry) => entry.name.toLowerCase() === normalizedLocation.toLowerCase()
    );

    if (existing) {
      existing.count += 1;
    } else {
      stats[normalizedState].districts.push({ name: normalizedLocation, count: 1 });
    }
  });

  return stats;
}

export function buildIndiaStateStats(registrations: Registration[]): Record<string, StateStat> {
  return buildCountryRegionStats(registrations, 'India');
}

export function buildIndiaStateChartData(registrations: Registration[]) {
  const stateStats = buildIndiaStateStats(registrations);

  return Object.entries(stateStats)
    .map(([name, stat]) => ({ name, members: stat.members }))
    .sort((a, b) => b.members - a.members);
}

export interface ChartCountRow {
  name: string;
  count: number;
}

export function buildTopBucketChartData(
  rows: ChartCountRow[],
  topN: number,
  otherLabel: string
): ChartCountRow[] {
  const sorted = [...rows].sort((a, b) => b.count - a.count);
  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const remainder = sorted.slice(topN).reduce((sum, row) => sum + row.count, 0);
  if (remainder > 0) {
    top.push({ name: otherLabel, count: remainder });
  }
  return top;
}

/** State / region counts from all registrations (India = state name; abroad = state + country). */
export function buildRegionChartData(registrations: Registration[], topN = 6) {
  const counts: Record<string, number> = {};

  registrations.forEach((registration) => {
    const country = normalizeCountry(registration.country);
    const stateRaw = registration.state?.trim();
    const stateLabel = stateRaw ? normalizeState(stateRaw) : 'Unspecified';
    const label = country === 'India' ? stateLabel : `${stateLabel}, ${country}`;
    counts[label] = (counts[label] || 0) + 1;
  });

  const rows = Object.entries(counts).map(([name, count]) => ({ name, count }));

  return {
    chartData: buildTopBucketChartData(rows, topN, 'Other States / Regions').map(
      ({ name, count }) => ({ name, members: count })
    ),
    totalRegions: rows.length,
  };
}

export function categorizeOccupation(occupation: string | undefined): string {
  const occ = (occupation ?? '').toLowerCase().trim();
  if (!occ) return 'Not specified';

  if (/software|engineer|developer|data scientist|research scientist|\bit\b|tech/.test(occ)) {
    return 'Technology / IT';
  }
  if (/business|owner|retail|shop|merchant|designer|fashion/.test(occ)) {
    return 'Business / Creative';
  }
  if (/doctor|pediatrician|health|medical|nurse|physician/.test(occ)) {
    return 'Healthcare / Medical';
  }
  if (/student|scholar|undergraduate|college|school student/.test(occ)) {
    return 'Students / Scholar';
  }
  if (/teacher|professor|education|school/.test(occ)) {
    return 'Education / Teaching';
  }
  if (/govt|government|civil|police|officer|contractor|administration/.test(occ)) {
    return 'Govt. Service / Administration';
  }
  if (/finance|analyst|accountant|banking|chartered/.test(occ)) {
    return 'Finance / Banking';
  }
  if (/agricultur|farmer|farming/.test(occ)) {
    return 'Agriculture';
  }

  return 'Other';
}

export function buildOccupationChartData(registrations: Registration[], topN = 6) {
  const counts: Record<string, number> = {};

  registrations.forEach((registration) => {
    const category = categorizeOccupation(registration.occupation);
    counts[category] = (counts[category] || 0) + 1;
  });

  const rows = Object.entries(counts).map(([name, count]) => ({ name, count }));
  const bucketed = buildTopBucketChartData(rows, topN, 'Other Sectors');

  return bucketed.map(({ name, count }) => ({ name, value: count }));
}

export function buildGotraChartData(registrations: Registration[], topN = 6) {
  const counts: Record<string, number> = {};

  registrations.forEach((registration) => {
    const gotra = registration.gotra?.trim();
    const key = gotra ? titleCase(gotra) : 'Not specified';
    counts[key] = (counts[key] || 0) + 1;
  });

  const rows = Object.entries(counts).map(([name, count]) => ({ name, count }));
  return buildTopBucketChartData(rows, topN, 'Other Gotras');
}

/** Live member counts shared by the home hero, stats charts, and admin KPI dashboard. */
export interface MemberDashboardStats {
  totalRegistrations: number;
  regionsTracked: number;
  countriesRepresented: number;
  verifiedLineages: number;
}

export function computeMemberDashboardStats(registrations: Registration[]): MemberDashboardStats {
  const { totalRegions } = buildRegionChartData(registrations);
  const worldStats = buildWorldStats(registrations);

  const gotraKeys = new Set<string>();
  registrations.forEach((registration) => {
    const gotra = registration.gotra?.trim();
    if (gotra) {
      gotraKeys.add(titleCase(gotra));
    }
  });

  return {
    totalRegistrations: registrations.length,
    regionsTracked: totalRegions,
    countriesRepresented: Object.keys(worldStats).length,
    verifiedLineages: gotraKeys.size,
  };
}
