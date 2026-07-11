#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

for (const table of ['members', 'community_updates', 'forum_discussions', 'forum_comments', 'forum_likes', 'admin_users']) {
  const { error } = await client.from(table).select('*', { count: 'exact', head: true });
  console.log(table + ':', error ? `ERROR ${error.message}` : 'OK');
}

const { data, error } = await client.from('admin_users').select('username, is_super_admin').limit(5);
console.log('admin_users rows:', error?.message ?? data);
