import { isSupabaseConfigured } from './supabase/client';
import * as adminRepo from './supabase/repositories/admin';

export interface AdminSession {
  username: string;
  isSuperAdmin: boolean;
  loggedInAt: string;
}

export interface StoredAdminAccount {
  id: string;
  username: string;
  password: string;
  createdAt: string;
  createdBy: string;
}

export interface AdminDirectoryEntry {
  id: string;
  username: string;
  isSuperAdmin: boolean;
  createdAt?: string;
}

const ADMIN_SESSION_KEY = 'gnc_admin_session';
const ADMIN_ACCOUNTS_KEY = 'gnc_admin_accounts';

export const SUPER_ADMIN_USERNAME = 'superadmin';

/** Legacy alias — treated as super admin for existing installs. */
const LEGACY_SUPER_ADMIN_USERNAME = 'admin';

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function isSuperAdminUsername(username: string): boolean {
  const normalized = normalizeUsername(username);
  return normalized === SUPER_ADMIN_USERNAME || normalized === LEGACY_SUPER_ADMIN_USERNAME;
}

function readStoredAdmins(): StoredAdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMIN_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredAdminAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredAdmins(accounts: StoredAdminAccount[]): void {
  localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem('gnc_admin_authenticated');
}

function authenticateAdminLocal(username: string, password: string): AdminSession | null {
  const normalizedUsername = normalizeUsername(username);
  const trimmedPassword = password.trim();

  // Super admin auth is Supabase-only — no client-side password fallback.
  if (isSuperAdminUsername(normalizedUsername)) {
    return null;
  }

  const account = readStoredAdmins().find(
    (entry) =>
      normalizeUsername(entry.username) === normalizedUsername && entry.password === trimmedPassword
  );

  if (!account) return null;

  const session: AdminSession = {
    username: account.username,
    isSuperAdmin: false,
    loggedInAt: new Date().toISOString(),
  };
  setAdminSession(session);
  return session;
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    return authenticateAdminLocal(username, password);
  }

  try {
    const match = await adminRepo.verifyAdminLogin(username, password);
    if (!match) return null;

    const session: AdminSession = {
      username: match.username,
      isSuperAdmin: match.isSuperAdmin,
      loggedInAt: new Date().toISOString(),
    };
    setAdminSession(session);
    return session;
  } catch {
    return null;
  }
}

export function listAdminDirectory(): AdminDirectoryEntry[] {
  const superAdmin: AdminDirectoryEntry = {
    id: 'super-admin',
    username: SUPER_ADMIN_USERNAME,
    isSuperAdmin: true,
  };

  const additional = readStoredAdmins().map((account) => ({
    id: account.id,
    username: account.username,
    isSuperAdmin: false,
    createdAt: account.createdAt,
  }));

  return [superAdmin, ...additional];
}

export async function fetchAdminDirectory(): Promise<AdminDirectoryEntry[]> {
  if (!isSupabaseConfigured()) {
    return listAdminDirectory();
  }

  return adminRepo.fetchAdminDirectory();
}

export async function addAdminAccount(
  username: string,
  password: string,
  createdBy: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || trimmedUsername.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters.' };
  }
  if (!trimmedPassword || trimmedPassword.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (isSuperAdminUsername(trimmedUsername)) {
    return { ok: false, error: 'That username is reserved for the super admin.' };
  }

  if (isSupabaseConfigured()) {
    return adminRepo.createAdminAccount(createdBy, trimmedUsername, trimmedPassword);
  }

  const normalized = normalizeUsername(trimmedUsername);
  const accounts = readStoredAdmins();

  if (accounts.some((account) => normalizeUsername(account.username) === normalized)) {
    return { ok: false, error: 'An admin with this username already exists.' };
  }

  accounts.push({
    id: `admin-${Date.now()}`,
    username: trimmedUsername,
    password: trimmedPassword,
    createdAt: new Date().toISOString(),
    createdBy,
  });

  writeStoredAdmins(accounts);
  return { ok: true };
}

export async function removeAdminAccount(
  adminId: string,
  requester: AdminSession
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!requester.isSuperAdmin) {
    return { ok: false, error: 'Only the super admin can remove other admins.' };
  }

  if (isSupabaseConfigured()) {
    if (adminId === 'super-admin') {
      return { ok: false, error: 'The super admin account cannot be removed.' };
    }
    return adminRepo.removeAdminAccount(requester.username, adminId);
  }

  if (adminId === 'super-admin') {
    return { ok: false, error: 'The super admin account cannot be removed.' };
  }

  const accounts = readStoredAdmins();
  const nextAccounts = accounts.filter((account) => account.id !== adminId);

  if (nextAccounts.length === accounts.length) {
    return { ok: false, error: 'Admin account not found.' };
  }

  writeStoredAdmins(nextAccounts);
  return { ok: true };
}

export { isSupabaseConfigured };
