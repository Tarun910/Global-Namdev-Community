#!/usr/bin/env node
/**
 * Check member password auth readiness on Supabase (no secrets printed).
 * Usage: npm run supabase:check-member-auth
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function loadEnvFile() {
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

loadEnvFile();

const url = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const client = createClient(url, anonKey);

const { error: membersError } = await client
  .from('members')
  .select('id', { count: 'exact', head: true });
console.log('members table:', membersError ? `FAIL (${membersError.message})` : 'OK');

const { error: hashColError } = await client.from('members').select('password_hash').limit(1);
console.log(
  'password_hash column:',
  hashColError ? `MISSING (${hashColError.message})` : 'OK — run 003 migration if this fails',
);

const { error: adminRpcError } = await client.rpc('verify_admin_login', {
  p_username: 'superadmin',
  p_password: 'password123',
});
console.log(
  'pgcrypto (admin RPC):',
  adminRpcError ? `FAIL (${adminRpcError.message})` : 'OK — run 002 migration if this fails',
);

const { error: memberRpcError } = await client.rpc('verify_member_login', {
  p_identifier: '0000000000',
  p_password: 'testpass',
  p_dial_code: '+91',
});
console.log(
  'verify_member_login RPC:',
  memberRpcError ? `FAIL (${memberRpcError.message})` : 'OK',
);

const allOk = !membersError && !hashColError && !adminRpcError && !memberRpcError;
console.log(allOk ? '\n✅ Member password login should work on Vercel.' : '\n⚠️  Fix failed checks before Vercel password login will work.');
process.exit(allOk ? 0 : 1);
