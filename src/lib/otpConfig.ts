const OTP_API_BASE = import.meta.env.VITE_OTP_API_URL?.replace(/\/$/, '') ?? '';

export interface OtpConfig {
  mode: 'widget' | 'api' | 'demo';
  live: boolean;
  widgetId?: string;
  tokenAuth?: string;
}

let cachedConfig: OtpConfig | null = null;

function configFromViteEnv(): OtpConfig | null {
  const widgetId = import.meta.env.VITE_MSG91_WIDGET_ID?.trim();
  const tokenAuth = import.meta.env.VITE_MSG91_TOKEN_AUTH?.trim();
  if (!widgetId || !tokenAuth) return null;
  return { mode: 'widget', live: true, widgetId, tokenAuth };
}

export async function getOtpConfig(forceRefresh = false): Promise<OtpConfig> {
  if (cachedConfig && !forceRefresh) return cachedConfig;

  const fromEnv = configFromViteEnv();
  if (fromEnv) {
    cachedConfig = fromEnv;
    return fromEnv;
  }

  try {
    const res = await fetch(`${OTP_API_BASE}/api/otp/config`);
    if (res.ok) {
      cachedConfig = (await res.json()) as OtpConfig;
      return cachedConfig;
    }
  } catch {
    // fall through to demo
  }

  cachedConfig = { mode: 'demo', live: false };
  return cachedConfig;
}

export function isWidgetOtpConfig(config: OtpConfig): boolean {
  return config.mode === 'widget' && Boolean(config.widgetId && config.tokenAuth);
}

export async function isWidgetOtpEnabled(): Promise<boolean> {
  const config = await getOtpConfig();
  return isWidgetOtpConfig(config);
}
