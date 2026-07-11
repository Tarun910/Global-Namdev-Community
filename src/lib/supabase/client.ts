import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function useDevProxy(): boolean {
  return import.meta.env.VITE_SUPABASE_USE_PROXY === 'true' && import.meta.env.DEV;
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && (key || useDevProxy()));
}

function createProxyFetch(projectUrl: string): typeof fetch {
  const normalizedProjectUrl = projectUrl.replace(/\/$/, '');

  return (input, init) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (requestUrl.startsWith(normalizedProjectUrl)) {
      const proxyUrl = requestUrl.replace(normalizedProjectUrl, `${window.location.origin}/api/supabase`);
      return fetch(proxyUrl, init);
    }

    return fetch(input, init);
  };
}

export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_USE_PROXY=true in dev).'
    );
  }

  if (!client) {
    const url = import.meta.env.VITE_SUPABASE_URL!;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || 'dev-proxy-placeholder';

    client = createClient(url, key, {
      global: useDevProxy() ? { fetch: createProxyFetch(url) } : undefined,
    });
  }

  return client;
}
