#!/usr/bin/env node
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

const url = process.env.VITE_SUPABASE_URL ?? 'https://govixszivnxfzujiztad.supabase.co';
const key =
  process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.argv[2];

if (!key) {
  console.error('No Supabase key provided.');
  process.exit(1);
}

const client = createClient(url, key);
const { error: membersError } = await client.from('members').select('id', { count: 'exact', head: true });
const { data: adminData, error: adminError } = await client.rpc('verify_admin_login', {
  p_username: 'superadmin',
  p_password: 'password123',
});

console.log('URL:', url);
console.log('members table:', membersError ? `MISSING (${membersError.message})` : 'OK');
console.log('admin RPC:', adminError ? `MISSING (${adminError.message})` : adminData?.length ? 'OK' : 'EMPTY');
