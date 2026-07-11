#!/usr/bin/env node
/**
 * Apply Supabase migration using the service role key via direct SQL API.
 * Uses Supabase Management API database query endpoint when SUPABASE_ACCESS_TOKEN is set,
 * OR applies migration via linked `supabase db push`.
 *
 * For manual setup: run SQL in Supabase SQL Editor instead.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'govixszivnxfzujiztad';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const dbPassword = process.env.SUPABASE_DB_PASSWORD?.trim();

if (accessToken) {
  const sql = fs.readFileSync(
    path.join(root, 'supabase/migrations/001_initial_schema.sql'),
    'utf8'
  );

  console.log('Running migration via Supabase Management API…');
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Migration failed:', res.status, body);
    process.exit(1);
  }

  console.log('✅ Migration applied.');
  process.exit(0);
}

if (dbPassword) {
  console.log('Running migration via supabase db push…');
  execSync(
    `npx supabase link --project-ref ${projectRef} --password "${dbPassword}" --yes`,
    { cwd: root, stdio: 'inherit' }
  );
  execSync(`npx supabase db push --linked --password "${dbPassword}" --yes`, {
    cwd: root,
    stdio: 'inherit',
  });
  console.log('✅ Migration applied.');
  process.exit(0);
}

console.log(`
Could not run migration automatically.

Please do ONE of the following:

1) Supabase Dashboard → SQL Editor → paste and run:
   supabase/migrations/001_initial_schema.sql

2) Or set SUPABASE_DB_PASSWORD and run:
   npm run supabase:migrate

3) Or set SUPABASE_ACCESS_TOKEN and run:
   npm run supabase:migrate
`);

process.exit(1);
