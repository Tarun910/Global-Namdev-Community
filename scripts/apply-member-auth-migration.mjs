#!/usr/bin/env node
/**
 * Apply member password auth migrations (002 pgcrypto + 003 password auth).
 * Usage: npm run supabase:apply-member-auth
 *
 * Requires ONE of:
 *   SUPABASE_ACCESS_TOKEN — Supabase dashboard → Account → Access Tokens
 *   SUPABASE_DB_PASSWORD  — Database password (uses supabase db push)
 *
 * Or paste supabase/migrations/002_pgcrypto_fix.sql and
 * 003_member_password_auth.sql into Supabase SQL Editor manually.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

if (fs.existsSync(envPath)) {
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

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'govixszivnxfzujiztad';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();

async function runSqlViaManagementApi(label, fileName) {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations', fileName), 'utf8');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'global-namdev-community-setup/1.0',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  console.log(`${label}:`, res.status, body.slice(0, 400));
  if (!res.ok) process.exit(1);
}

if (accessToken) {
  await runSqlViaManagementApi('002_pgcrypto_fix', '002_pgcrypto_fix.sql');
  await runSqlViaManagementApi('003_member_password_auth', '003_member_password_auth.sql');
  console.log('Member auth migrations applied via Management API.');
  process.exit(0);
}

if (dbPassword) {
  console.log('Linking project and pushing migrations via Supabase CLI…');
  execSync(`npx supabase link --project-ref ${projectRef} --password "${dbPassword}" --yes`, {
    cwd: root,
    stdio: 'inherit',
  });
  execSync(`npx supabase db push --linked --password "${dbPassword}" --yes`, {
    cwd: root,
    stdio: 'inherit',
  });
  console.log('Member auth migrations applied via Supabase CLI.');
  process.exit(0);
}

console.log(`
Could not apply migrations automatically.

Do this in Supabase Dashboard → SQL Editor (run in order):

1) supabase/migrations/002_pgcrypto_fix.sql
2) supabase/migrations/003_member_password_auth.sql

Or set one of these in .env and re-run:
  SUPABASE_ACCESS_TOKEN  (Account → Access Tokens at supabase.com/dashboard/account/tokens)
  SUPABASE_DB_PASSWORD   (Project Settings → Database → password)
`);

process.exit(1);
