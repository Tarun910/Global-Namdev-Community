#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq <= 0) continue;
  const key = trimmed.slice(0, eq);
  const value = trimmed.slice(eq + 1);
  if (process.env[key] === undefined) process.env[key] = value;
}

const client = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await client
  .from('admin_users')
  .select('username, password_hash')
  .eq('username', 'superadmin')
  .single();

console.log('superadmin hash prefix:', data?.password_hash?.slice(0, 7));
console.log(
  'password123 matches:',
  data?.password_hash ? bcrypt.compareSync('password123', data.password_hash) : false
);
