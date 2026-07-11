import { CommunityUpdate } from '../../types';

const BULLETIN_READS_KEY = 'gnc_bulletin_reads';
const FORUM_CLIENT_ID_KEY = 'gnc_forum_client_id';

function readBulletinReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(BULLETIN_READS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeBulletinReadIds(ids: Set<string>): void {
  localStorage.setItem(BULLETIN_READS_KEY, JSON.stringify([...ids]));
}

export function applyBulletinReadState(updates: CommunityUpdate[]): CommunityUpdate[] {
  const readIds = readBulletinReadIds();
  return updates.map((update) => ({
    ...update,
    isRead: readIds.has(update.id) || update.isRead === true,
  }));
}

export function markBulletinRead(id: string): void {
  const readIds = readBulletinReadIds();
  readIds.add(id);
  writeBulletinReadIds(readIds);
}

export function markAllBulletinsRead(ids: string[]): void {
  const readIds = readBulletinReadIds();
  for (const id of ids) readIds.add(id);
  writeBulletinReadIds(readIds);
}

export function getForumClientId(): string {
  let id = localStorage.getItem(FORUM_CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(FORUM_CLIENT_ID_KEY, id);
  }
  return id;
}
