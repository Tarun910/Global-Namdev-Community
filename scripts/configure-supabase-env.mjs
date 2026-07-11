#!/usr/bin/env node
/**
 * Write Supabase URL + anon key to .env and verify the connection.
 *
 * Usage:
 *   node scripts/configure-supabase-env.mjs <url> <anon_key>
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

const url = process.argv[2]?.trim() ?? process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.argv[3]?.trim() ?? process.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!url || !anonKey) {
  console.error('Usage: node scripts/configure-supabase-env.mjs <url> <anon_key>');
  process.exit(1);
}

function upsertEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    if (content.length > 0 && !content.endsWith('\n')) content += '\n';
    content += `\n# Supabase\n${line}\n`;
  }

  fs.writeFileSync(envPath, content, 'utf8');
}

upsertEnv('VITE_SUPABASE_URL', url);
upsertEnv('VITE_SUPABASE_ANON_KEY', anonKey);

const client = createClient(url, anonKey);
const { error: membersError } = await client.from('members').select('id', { count: 'exact', head: true });
const { error: adminError } = await client.rpc('verify_admin_login', {
  p_username: 'superadmin',
  p_password: 'password123',
});

if (membersError) {
  console.error('\n❌ Connected but tables missing. Run the SQL migration first.');
  console.error(`   Error: ${membersError.message}`);
  console.error('   File: supabase/migrations/001_initial_schema.sql\n');
  process.exit(1);
}

console.log('\n✅ Supabase configured in .env');
console.log(`   URL: ${url}`);
console.log(`   members table: OK`);
console.log(`   admin login RPC: ${adminError ? 'missing — run migration SQL' : 'OK'}`);
console.log('\nRestart dev server: npm run dev\n');
