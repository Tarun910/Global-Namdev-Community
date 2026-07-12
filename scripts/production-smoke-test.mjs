#!/usr/bin/env node
/**
 * Production smoke test — Supabase backend + optional live site URL.
 * Usage:
 *   npm run test:production
 *   npm run test:production -- https://your-site.vercel.app
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { probeAdminLoginRpc, verifyAdminLoginWithPassword } from './loadEnv.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function loadEnv() {
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

loadEnv();

const siteUrl = (process.argv[2] ?? process.env.PRODUCTION_URL ?? '').replace(/\/$/, '');
const url = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

const results = [];
let failed = 0;

function pass(name, detail = '') {
  results.push({ status: 'PASS', name, detail });
  console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  failed += 1;
  results.push({ status: 'FAIL', name, detail });
  console.log(`❌ ${name}${detail ? ` — ${detail}` : ''}`);
}

function warn(name, detail = '') {
  results.push({ status: 'WARN', name, detail });
  console.log(`⚠️  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function testSupabase() {
  console.log('\n── Supabase backend ──\n');
  if (!url || !anonKey) {
    fail('Supabase env', 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    return null;
  }
  pass('Supabase env configured');
  return createClient(url, anonKey);
}

async function testTables(client) {
  const tables = [
    'members',
    'community_updates',
    'forum_discussions',
    'forum_comments',
    'forum_likes',
    'admin_users',
  ];

  for (const table of tables) {
    const { error, count } = await client.from(table).select('*', { count: 'exact', head: true });
    if (error) fail(`Table: ${table}`, error.message);
    else pass(`Table: ${table}`, `${count ?? 0} rows`);
  }
}

async function testRpcs(client) {
  const adminErr = await probeAdminLoginRpc(client);
  if (adminErr) fail('RPC verify_admin_login', adminErr.message);
  else pass('RPC verify_admin_login', 'callable');

  const adminTestPassword = process.env.ADMIN_TEST_PASSWORD?.trim();
  if (adminTestPassword) {
    const loginCheck = await verifyAdminLoginWithPassword(client, adminTestPassword);
    if (loginCheck.ok) pass('Superadmin login', 'ADMIN_TEST_PASSWORD accepted');
    else fail('Superadmin login', loginCheck.error ?? 'wrong password');
  } else {
    warn('Superadmin login', 'Skipped — set ADMIN_TEST_PASSWORD in .env to verify');
  }

  const { error: memberErr } = await client.rpc('verify_member_login', {
    p_identifier: '0000000000',
    p_password: 'testpass',
    p_dial_code: '+91',
  });
  if (memberErr) fail('RPC verify_member_login', memberErr.message);
  else pass('RPC verify_member_login', 'callable');

  const { error: setPwdErr } = await client.rpc('set_member_password_on_register', {
    p_member_id: 'nonexistent-id',
    p_dial_code: '+91',
    p_mobile: '0000000000',
    p_password: 'testpass',
  });
  if (setPwdErr) fail('RPC set_member_password_on_register', setPwdErr.message);
  else pass('RPC set_member_password_on_register', 'callable');

  const { error: resetErr } = await client.rpc('reset_member_password', {
    p_dial_code: '+91',
    p_mobile: '0000000000',
    p_dob_or_age: 'x',
    p_fathers_name: 'x',
    p_community_id: '',
    p_new_password: 'testpass',
  });
  if (resetErr) fail('RPC reset_member_password', resetErr.message);
  else pass('RPC reset_member_password', 'callable');
}

async function testMemberColumns(client) {
  const { error } = await client.from('members').select('password_hash, mobile_verified').limit(1);
  if (error) fail('Member password columns', error.message);
  else pass('Member password columns', 'password_hash + mobile_verified exist');
}

async function testSite(urlBase) {
  console.log('\n── Live site ──\n');
  pass('Testing URL', urlBase);

  const routes = [
    '/',
    '/map',
    '/forum',
    '/updates',
    '/register',
    '/login',
    '/forgot-password',
    '/profile',
    '/download',
    '/adminavengers',
    '/terms',
    '/privacy',
    '/cookies',
    '/guidelines',
    '/support',
  ];

  for (const route of routes) {
    try {
      const res = await fetch(`${urlBase}${route}`, { redirect: 'follow' });
      const text = await res.text();
      const isSpa = res.ok && text.includes('<div id="root"') && text.includes('/assets/index');
      if (isSpa) pass(`Route ${route}`, `HTTP ${res.status}`);
      else if (res.ok) warn(`Route ${route}`, `HTTP ${res.status} but unexpected HTML`);
      else fail(`Route ${route}`, `HTTP ${res.status}`);
    } catch (err) {
      fail(`Route ${route}`, err instanceof Error ? err.message : 'fetch failed');
    }
  }

  try {
    const res = await fetch(`${urlBase}/api/otp/status`);
    const data = await res.json();
    if (res.ok && typeof data.live === 'boolean') {
      pass('OTP API /api/otp/status', `live=${data.live}, mode=${data.mode ?? 'n/a'}`);
    } else {
      fail('OTP API /api/otp/status', `HTTP ${res.status}`);
    }
  } catch (err) {
    fail('OTP API /api/otp/status', err instanceof Error ? err.message : 'fetch failed');
  }

  try {
    const res = await fetch(`${urlBase}/api/otp/config`);
    const data = await res.json();
    if (res.ok && data.widgetId) pass('OTP API /api/otp/config', 'widget configured');
    else if (res.ok) warn('OTP API /api/otp/config', 'no widgetId in response');
    else fail('OTP API /api/otp/config', `HTTP ${res.status}`);
  } catch (err) {
    fail('OTP API /api/otp/config', err instanceof Error ? err.message : 'fetch failed');
  }

  try {
    const res = await fetch(urlBase);
    const html = await res.text();
    const hasSupabase = html.includes('govixszivnxfzujiztad') || html.includes('supabase.co');
    if (hasSupabase) pass('Supabase in bundle', 'URL found in built assets');
    else warn('Supabase in bundle', 'Could not detect Supabase URL in HTML (may be in JS chunks only)');
  } catch {
    warn('Supabase in bundle', 'Could not inspect HTML');
  }
}

function testBuildArtifacts() {
  console.log('\n── Build artifacts ──\n');
  const distIndex = path.join(root, 'dist/index.html');
  if (!fs.existsSync(distIndex)) {
    warn('dist/', 'Run npm run build first');
    return;
  }
  pass('dist/index.html', 'exists');
  const assetsDir = path.join(root, 'dist/assets');
  const assets = fs.readdirSync(assetsDir);
  const required = ['index-', 'supabase-'];
  for (const prefix of required) {
    const found = assets.some((f) => f.startsWith(prefix));
    if (found) pass(`Asset chunk ${prefix}*`, 'present');
    else fail(`Asset chunk ${prefix}*`, 'missing');
  }
}

console.log('Global Namdev Community — Production Smoke Test\n');

testBuildArtifacts();

const client = await testSupabase();
if (client) {
  await testTables(client);
  await testMemberColumns(client);
  await testRpcs(client);
}

if (siteUrl) {
  await testSite(siteUrl);
} else {
  console.log('\n── Live site ──\n');
  warn('Live site', 'Skipped — pass URL: npm run test:production -- https://your-site.vercel.app');
}

console.log('\n── Summary ──\n');
const passCount = results.filter((r) => r.status === 'PASS').length;
const warnCount = results.filter((r) => r.status === 'WARN').length;
console.log(`Passed: ${passCount}  Failed: ${failed}  Warnings: ${warnCount}`);

if (failed > 0) {
  console.log('\nFailed checks:');
  for (const r of results.filter((x) => x.status === 'FAIL')) {
    console.log(`  • ${r.name}: ${r.detail}`);
  }
  process.exit(1);
}

console.log('\n✅ Production smoke test completed.');
process.exit(0);
