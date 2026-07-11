#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const projectRef = process.env.SUPABASE_PROJECT_REF;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/002_pgcrypto_fix.sql'), 'utf8');

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'global-namdev-community-setup/1.0',
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.text();
console.log(res.status, body);
