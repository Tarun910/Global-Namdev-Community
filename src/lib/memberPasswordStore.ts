const PASSWORD_STORE_KEY = 'gnc_member_password_hashes';

type PasswordHashMap = Record<string, string>;

type BcryptModule = typeof import('bcryptjs');

let bcryptPromise: Promise<BcryptModule> | null = null;

async function getBcrypt(): Promise<BcryptModule> {
  if (!bcryptPromise) {
    bcryptPromise = import('bcryptjs');
  }
  return bcryptPromise;
}

function readStore(): PasswordHashMap {
  try {
    const raw = localStorage.getItem(PASSWORD_STORE_KEY);
    return raw ? (JSON.parse(raw) as PasswordHashMap) : {};
  } catch {
    return {};
  }
}

function writeStore(store: PasswordHashMap): void {
  localStorage.setItem(PASSWORD_STORE_KEY, JSON.stringify(store));
}

export async function setLocalMemberPassword(memberId: string, password: string): Promise<void> {
  const bcrypt = await getBcrypt();
  const store = readStore();
  store[memberId] = bcrypt.hashSync(password.trim(), 10);
  writeStore(store);
}

export async function verifyLocalMemberPassword(memberId: string, password: string): Promise<boolean> {
  const hash = readStore()[memberId];
  if (!hash) return false;
  const bcrypt = await getBcrypt();
  return bcrypt.compareSync(password.trim(), hash);
}

export function removeLocalMemberPassword(memberId: string): void {
  const store = readStore();
  delete store[memberId];
  writeStore(store);
}

export function memberHasLocalPassword(memberId: string): boolean {
  return Boolean(readStore()[memberId]);
}
