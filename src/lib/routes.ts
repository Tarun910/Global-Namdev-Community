export const APP_ROUTES = {
  home: '/',
  map: '/map',
  forum: '/forum',
  updates: '/updates',
  register: '/register',
  login: '/login',
  profile: '/profile',
  download: '/download',
  verify: '/verify',
  admin: '/adminavengers',
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
  guidelines: '/guidelines',
  support: '/support',
} as const;

export type AppRoute = keyof typeof APP_ROUTES;

const PATH_TO_TAB = Object.fromEntries(
  Object.entries(APP_ROUTES).map(([tab, path]) => [path, tab])
) as Record<string, AppRoute>;

PATH_TO_TAB['/home'] = 'home';

const BULLETIN_PATH_RE = /^\/updates\/([^/]+)$/;

export function bulletinPath(id: string): string {
  return `/updates/${encodeURIComponent(id)}`;
}

export function parseBulletinId(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/';
  const match = normalized.match(BULLETIN_PATH_RE);
  return match ? decodeURIComponent(match[1]) : null;
}

export function tabToPath(tab: string): string {
  if (tab in APP_ROUTES) {
    return APP_ROUTES[tab as AppRoute];
  }
  return APP_ROUTES.home;
}

export function pathToTab(pathname: string): AppRoute {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/verify') return 'admin';
  if (normalized === '/admin') return 'home';
  if (BULLETIN_PATH_RE.test(normalized)) return 'updates';
  return PATH_TO_TAB[normalized] ?? 'home';
}

export function navigateToTab(tab: string, replace = false): void {
  const path = tabToPath(tab);
  if (window.location.pathname === path) return;

  if (replace) {
    window.history.replaceState({ tab }, '', path);
  } else {
    window.history.pushState({ tab }, '', path);
  }
}
