#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { loadEnvFile, probeAdminLoginRpc } from './loadEnv.mjs';

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
const adminRpcError = await probeAdminLoginRpc(client);

console.log('URL:', url);
console.log('members table:', membersError ? `MISSING (${membersError.message})` : 'OK');
console.log('admin RPC:', adminRpcError ? `MISSING (${adminRpcError.message})` : 'OK');
