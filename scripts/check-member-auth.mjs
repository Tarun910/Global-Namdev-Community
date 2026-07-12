#!/usr/bin/env node
/**
 * Check member password auth readiness on Supabase (no secrets printed).
 * Usage: npm run supabase:check-member-auth
 *
 * Optional: set ADMIN_TEST_PASSWORD in .env to verify superadmin login.
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile, probeAdminLoginRpc, verifyAdminLoginWithPassword } from './loadEnv.mjs';

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

const adminRpcError = await probeAdminLoginRpc(client);
console.log(
  'pgcrypto (admin RPC):',
  adminRpcError ? `FAIL (${adminRpcError.message})` : 'OK — run 002 migration if this fails',
);

const adminTestPassword = process.env.ADMIN_TEST_PASSWORD?.trim();
if (adminTestPassword) {
  const loginCheck = await verifyAdminLoginWithPassword(client, adminTestPassword);
  console.log(
    'superadmin login:',
    loginCheck.ok ? 'OK' : `FAIL (${loginCheck.error ?? 'wrong password'})`,
  );
} else {
  console.log('superadmin login: skipped (set ADMIN_TEST_PASSWORD in .env to verify)');
}

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
