import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

export function loadEnvFile(envPath = path.join(root, '.env')) {
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export async function probeAdminLoginRpc(client) {
  const { error } = await client.rpc('verify_admin_login', {
    p_username: 'superadmin',
    p_password: '__rpc_probe__',
  });
  return error;
}

export async function verifyAdminLoginWithPassword(client, password) {
  const { data, error } = await client.rpc('verify_admin_login', {
    p_username: 'superadmin',
    p_password: password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: Boolean(data?.length), error: null };
}
