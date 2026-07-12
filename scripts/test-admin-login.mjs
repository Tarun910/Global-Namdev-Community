#!/usr/bin/env node
/**
 * Verify superadmin password hash (optional).
 * Set ADMIN_TEST_PASSWORD in .env — never commit real passwords to git.
 */
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile } from './loadEnv.mjs';

loadEnvFile();

const testPassword = process.env.ADMIN_TEST_PASSWORD?.trim();
if (!testPassword) {
  console.error('Set ADMIN_TEST_PASSWORD in .env to run this script.');
  process.exit(1);
}

const client = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data } = await client
  .from('admin_users')
  .select('username, password_hash')
  .eq('username', 'superadmin')
  .single();

console.log('superadmin hash prefix:', data?.password_hash?.slice(0, 7));
console.log(
  'ADMIN_TEST_PASSWORD matches:',
  data?.password_hash ? bcrypt.compareSync(testPassword, data.password_hash) : false,
);
