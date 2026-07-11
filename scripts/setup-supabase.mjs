#!/usr/bin/env node
/**
 * One-command Supabase cloud setup for Global Namdev Community.
 *
 * Requires SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
 *
 * Usage:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..."; npm run supabase:setup
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

const PROJECT_NAME = 'global-namdev-community';
const REGION = 'ap-south-1';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD ?? 'GncSupabase2026!Secure';

const token =
  process.env.SUPABASE_ACCESS_TOKEN?.trim() ??
  (() => {
    const setupEnv = path.join(root, 'supabase.access.env');
    if (!fs.existsSync(setupEnv)) return '';
    const match = fs.readFileSync(setupEnv, 'utf8').match(/^SUPABASE_ACCESS_TOKEN=(.+)$/m);
    return match?.[1]?.trim() ?? '';
  })();
if (!token) {
  console.error('\nMissing SUPABASE_ACCESS_TOKEN.');
  console.error('Create one at: https://supabase.com/dashboard/account/tokens');
  console.error('Then either:');
  console.error('  1. Save it to supabase.access.env as SUPABASE_ACCESS_TOKEN=sbp_...');
  console.error('  2. Or run: $env:SUPABASE_ACCESS_TOKEN="sbp_..."; npm run supabase:setup\n');
  process.exit(1);
}

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, {
    cwd: root,
    encoding: 'utf8',
    stdio: opts.silent ? 'pipe' : 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });
}

function runJson(cmd) {
  const out = run(`npx supabase --output json ${cmd.replace(/^npx supabase /, '')}`, { silent: true });
  const jsonStart = out.indexOf('[') >= 0 ? out.indexOf('[') : out.indexOf('{');
  if (jsonStart < 0) throw new Error(`Expected JSON from: ${cmd}\n${out}`);
  return JSON.parse(out.slice(jsonStart));
}

function upsertEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    content = content.replace(pattern, line);
  } else {
    if (content.length > 0 && !content.endsWith('\n')) content += '\n';
    content += `${line}\n`;
  }

  fs.writeFileSync(envPath, content, 'utf8');
}

console.log('Logging in to Supabase CLI…');
run(`npx supabase login --token "${token}" --no-browser`);

console.log('Fetching organizations…');
const orgs = runJson('npx supabase orgs list');
if (!orgs?.length) {
  console.error('No Supabase organizations found on this account.');
  process.exit(1);
}
const orgId = orgs[0].id;
console.log(`Using organization: ${orgs[0].name} (${orgId})`);

console.log('Listing existing projects…');
const projects = runJson('npx supabase projects list');
let project = projects.find((p) => p.name === PROJECT_NAME);

if (!project) {
  console.log(`Creating project "${PROJECT_NAME}" in ${REGION}…`);
  run(
    `npx supabase projects create "${PROJECT_NAME}" --org-id ${orgId} --db-password "${DB_PASSWORD}" --region ${REGION}`
  );
  console.log('Waiting for project to become active…');
  for (let i = 0; i < 36; i++) {
    await new Promise((r) => setTimeout(r, 10000));
    const list = runJson('npx supabase projects list');
    project = list.find((p) => p.name === PROJECT_NAME);
    if (project?.status === 'ACTIVE_HEALTHY') break;
    console.log(`  status: ${project?.status ?? 'pending'} (${i + 1}/36)`);
  }
}

if (!project) {
  console.error('Project was not found after creation.');
  process.exit(1);
}

const projectRef = project.id;
console.log(`Project ref: ${projectRef}`);

console.log('Linking local project…');
run(`npx supabase link --project-ref ${projectRef} --password "${DB_PASSWORD}" --yes`);

console.log('Pushing database migration…');
run(`npx supabase db push --linked --password "${DB_PASSWORD}" --yes`);

console.log('Fetching API keys…');
const keys = runJson(`npx supabase projects api-keys --project-ref ${projectRef}`);
const anonKey = keys.find((k) => k.name === 'anon')?.api_key;
const url = `https://${projectRef}.supabase.co`;

if (!anonKey) {
  console.error('Could not fetch anon API key.');
  process.exit(1);
}

upsertEnv('VITE_SUPABASE_URL', url);
upsertEnv('VITE_SUPABASE_ANON_KEY', anonKey);

console.log('\n✅ Supabase setup complete!');
console.log(`   URL:  ${url}`);
console.log(`   .env updated at: ${envPath}`);
console.log(`   Admin login: superadmin / password123`);
console.log('\nRestart the dev server: npm run dev\n');
