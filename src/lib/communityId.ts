import { Registration } from '../types';

const COMMUNITY_ID_PATTERN = /^GNC-(\d{4})-(\d+)$/;

export function parseCommunityIdSequence(communityId: string): number | null {
  const match = communityId.match(COMMUNITY_ID_PATTERN);
  if (!match) return null;
  const sequence = Number.parseInt(match[2], 10);
  return Number.isFinite(sequence) ? sequence : null;
}

/** Next sequential Community ID: GNC-{year}-000113, never reuses an existing ID. */
export function generateNextCommunityId(
  registrations: Registration[],
  year = new Date().getFullYear()
): string {
  const taken = new Set(registrations.map((registration) => registration.communityId));

  let nextSequence = 1;
  for (const registration of registrations) {
    const sequence = parseCommunityIdSequence(registration.communityId);
    if (sequence !== null && sequence >= nextSequence) {
      nextSequence = sequence + 1;
    }
  }

  let communityId = formatCommunityId(year, nextSequence);
  while (taken.has(communityId)) {
    nextSequence += 1;
    communityId = formatCommunityId(year, nextSequence);
  }

  return communityId;
}

function formatCommunityId(year: number, sequence: number): string {
  return `GNC-${year}-${String(sequence).padStart(6, '0')}`;
}
