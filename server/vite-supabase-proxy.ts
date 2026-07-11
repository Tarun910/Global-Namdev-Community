import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function createSupabaseProxyMiddleware(
  projectUrl: string,
  serviceRoleKey: string
): (req: IncomingMessage, res: ServerResponse, next: () => void) => void {
  const base = projectUrl.replace(/\/$/, '');

  return (req, res, next) => {
    const url = req.url ?? '';
    if (!url.startsWith('/api/supabase')) return next();

    void (async () => {
      try {
        const targetPath = url.replace(/^\/api\/supabase/, '');
        const targetUrl = `${base}${targetPath}`;

        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) {
          if (!value || key === 'host' || key === 'connection') continue;
          if (key === 'apikey' || key === 'authorization') continue;
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }

        headers.set('apikey', serviceRoleKey);
        headers.set('Authorization', `Bearer ${serviceRoleKey}`);

        const method = req.method ?? 'GET';
        const body =
          method === 'GET' || method === 'HEAD' ? undefined : await readBody(req);

        const upstream = await fetch(targetUrl, {
          method,
          headers,
          body: body?.length ? body : undefined,
        });

        res.statusCode = upstream.status;
        upstream.headers.forEach((value, key) => {
          if (key === 'transfer-encoding') return;
          res.setHeader(key, value);
        });

        const responseBody = Buffer.from(await upstream.arrayBuffer());
        res.end(responseBody);
      } catch (error) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            message: error instanceof Error ? error.message : 'Supabase proxy error',
          })
        );
      }
    })();
  };
}

export function supabaseProxyPlugin(): Plugin {
  return {
    name: 'gnc-supabase-proxy',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      const projectUrl = env.VITE_SUPABASE_URL?.trim();
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      const useProxy = env.VITE_SUPABASE_USE_PROXY === 'true';

      if (!useProxy || !projectUrl || !serviceRoleKey) return;

      server.middlewares.use(createSupabaseProxyMiddleware(projectUrl, serviceRoleKey));
    },
    configurePreviewServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      const projectUrl = env.VITE_SUPABASE_URL?.trim();
      const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
      const useProxy = env.VITE_SUPABASE_USE_PROXY === 'true';

      if (!useProxy || !projectUrl || !serviceRoleKey) return;

      server.middlewares.use(createSupabaseProxyMiddleware(projectUrl, serviceRoleKey));
    },
  };
}
