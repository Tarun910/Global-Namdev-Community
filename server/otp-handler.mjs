/**
 * OTP handler — MSG91 SMS (free credits on signup) with local demo fallback.
 * https://msg91.com/
 */

const DEMO_OTP = '123456';
const OTP_EXPIRY_MINUTES = 10;
const MAX_SENDS_PER_WINDOW = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** @type {Map<string, { count: number; windowStart: number }>} */
const sendRateLimit = new Map();

/** @type {Map<string, { otp: string; expiresAt: number }>} */
const demoOtpStore = new Map();

function getAuthKey() {
  return process.env.MSG91_AUTH_KEY?.trim() || '';
}

function getWidgetId() {
  return process.env.VITE_MSG91_WIDGET_ID?.trim() || process.env.MSG91_WIDGET_ID?.trim() || '';
}

function getWidgetToken() {
  return process.env.VITE_MSG91_TOKEN_AUTH?.trim() || process.env.MSG91_WIDGET_TOKEN?.trim() || '';
}

export function isWidgetModeEnabled() {
  return Boolean(getWidgetId() && getWidgetToken());
}

export function isLiveOtpEnabled() {
  return isWidgetModeEnabled() || Boolean(getAuthKey());
}

export function getOtpPublicConfig() {
  const widgetId = getWidgetId();
  const tokenAuth = getWidgetToken();
  const widgetReady = isWidgetModeEnabled();

  return {
    live: isLiveOtpEnabled(),
    mode: widgetReady ? 'widget' : getAuthKey() ? 'api' : 'demo',
    widgetId: widgetReady ? widgetId : undefined,
    tokenAuth: widgetReady ? tokenAuth : undefined,
  };
}

function normalizeLocalMobile(mobile) {
  return String(mobile).replace(/\D/g, '');
}

export function toFullMobile(dialCode, localMobile) {
  const code = String(dialCode).replace(/\D/g, '');
  const local = normalizeLocalMobile(localMobile);
  return `${code}${local}`;
}

function isValidLocalMobile(localMobile) {
  const digits = normalizeLocalMobile(localMobile);
  return digits.length >= 6 && digits.length <= 15;
}

function checkRateLimit(fullMobile) {
  const now = Date.now();
  const entry = sendRateLimit.get(fullMobile);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    sendRateLimit.set(fullMobile, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= MAX_SENDS_PER_WINDOW) {
    const retryAfterSec = Math.ceil((RATE_WINDOW_MS - (now - entry.windowStart)) / 1000);
    return `Too many OTP requests. Try again in ${retryAfterSec} seconds.`;
  }

  entry.count += 1;
  return null;
}

function storeDemoOtp(fullMobile) {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  demoOtpStore.set(fullMobile, { otp: DEMO_OTP, expiresAt });
}

function verifyDemoOtp(fullMobile, otp) {
  const entry = demoOtpStore.get(fullMobile);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    demoOtpStore.delete(fullMobile);
    return false;
  }
  return otp.trim() === entry.otp;
}

async function msg91Request(path, body) {
  const authKey = getAuthKey();
  const res = await fetch(`https://control.msg91.com/api/v5/otp${path}`, {
    method: 'POST',
    headers: {
      authkey: authKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = { type: 'error', message: 'Invalid response from SMS provider.' };
  }

  return { ok: res.ok, data };
}

export async function sendOtp({ dialCode, mobile }) {
  if (!isValidLocalMobile(mobile)) {
    return { success: false, message: 'Enter a valid mobile number.' };
  }

  const fullMobile = toFullMobile(dialCode, mobile);
  const rateError = checkRateLimit(fullMobile);
  if (rateError) {
    return { success: false, message: rateError };
  }

  if (!isLiveOtpEnabled()) {
    storeDemoOtp(fullMobile);
    console.log(`[OTP Demo] ${dialCode} ${mobile} — use ${DEMO_OTP} (set MSG91_AUTH_KEY for real SMS)`);
    return {
      success: true,
      demo: true,
      message: `Demo OTP ready. Use ${DEMO_OTP} to verify.`,
    };
  }

  const { ok, data } = await msg91Request('', {
    mobile: fullMobile,
    otp_length: 6,
    otp_expiry: OTP_EXPIRY_MINUTES,
  });

  if (!ok || data.type !== 'success') {
    const message =
      typeof data.message === 'string'
        ? data.message
        : 'Could not send OTP. Check MSG91_AUTH_KEY and account balance.';
    console.error('[OTP] MSG91 send failed:', data);
    return { success: false, message };
  }

  return {
    success: true,
    demo: false,
    message: 'OTP sent to your mobile number.',
  };
}

export async function verifyOtp({ dialCode, mobile, otp }) {
  const code = String(otp ?? '').trim();
  if (!/^\d{4,6}$/.test(code)) {
    return { success: false, message: 'Enter a valid 4–6 digit OTP.' };
  }

  const fullMobile = toFullMobile(dialCode, mobile);

  if (!isLiveOtpEnabled()) {
    const valid = verifyDemoOtp(fullMobile, code);
    if (!valid) {
      return { success: false, message: 'Invalid or expired OTP.' };
    }
    demoOtpStore.delete(fullMobile);
    return { success: true, message: 'OTP verified.' };
  }

  const { ok, data } = await msg91Request('/verify', {
    mobile: fullMobile,
    otp: code,
  });

  if (!ok || data.type !== 'success') {
    const message =
      typeof data.message === 'string' ? data.message : 'Invalid OTP. Please try again.';
    return { success: false, message };
  }

  return { success: true, message: 'OTP verified.' };
}

export async function resendOtp({ dialCode, mobile }) {
  if (!isValidLocalMobile(mobile)) {
    return { success: false, message: 'Enter a valid mobile number.' };
  }

  const fullMobile = toFullMobile(dialCode, mobile);
  const rateError = checkRateLimit(fullMobile);
  if (rateError) {
    return { success: false, message: rateError };
  }

  if (!isLiveOtpEnabled()) {
    storeDemoOtp(fullMobile);
    return {
      success: true,
      demo: true,
      message: `Demo OTP ready. Use ${DEMO_OTP} to verify.`,
    };
  }

  const { ok, data } = await msg91Request('/retry', {
    mobile: fullMobile,
    retrytype: 'text',
  });

  if (!ok || data.type !== 'success') {
    const message =
      typeof data.message === 'string' ? data.message : 'Could not resend OTP. Try again.';
    return { success: false, message };
  }

  return { success: true, demo: false, message: 'OTP resent to your mobile number.' };
}

export async function verifyWidgetAccessToken({ accessToken }) {
  const token = String(accessToken ?? '').trim();
  if (!token) {
    return { success: false, message: 'Missing access token.' };
  }

  if (!getAuthKey()) {
    return {
      success: false,
      message: 'Server MSG91_AUTH_KEY is not configured for token verification.',
    };
  }

  const authKey = getAuthKey();
  const attempts = [
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify({ 'access-token': token }),
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        authkey: authKey,
        'access-token': token,
      }),
    },
  ];

  let data = { type: 'error', message: 'OTP verification failed. Try again.' };
  let ok = false;

  for (const attempt of attempts) {
    const res = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: attempt.headers,
      body: attempt.body,
    });

    try {
      data = await res.json();
    } catch {
      data = { type: 'error', message: 'Invalid response from MSG91.' };
    }

    if (res.ok && data.type === 'success') {
      ok = true;
      break;
    }
  }

  if (!ok) {
    const message =
      typeof data.message === 'string' ? data.message : 'OTP verification failed. Try again.';
    console.error('[OTP] Widget token verify failed:', data);
    return { success: false, message };
  }

  return { success: true, message: 'OTP verified.', verified: data };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function createOtpMiddleware() {
  return async (req, res, next) => {
    const url = req.url?.split('?')[0] ?? '';

    if (!url.startsWith('/api/otp')) {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.end();
      return;
    }

    try {
      if (req.method === 'GET' && url === '/api/otp/status') {
        const config = getOtpPublicConfig();
        sendJson(res, 200, { live: config.live, mode: config.mode });
        return;
      }

      if (req.method === 'GET' && url === '/api/otp/config') {
        sendJson(res, 200, getOtpPublicConfig());
        return;
      }

      if (req.method !== 'POST') {
        sendJson(res, 405, { success: false, message: 'Method not allowed.' });
        return;
      }

      const body = await readJsonBody(req);

      if (url === '/api/otp/send') {
        sendJson(res, 200, await sendOtp(body));
        return;
      }

      if (url === '/api/otp/verify') {
        sendJson(res, 200, await verifyOtp(body));
        return;
      }

      if (url === '/api/otp/resend') {
        sendJson(res, 200, await resendOtp(body));
        return;
      }

      if (url === '/api/otp/verify-token') {
        sendJson(res, 200, await verifyWidgetAccessToken(body));
        return;
      }

      sendJson(res, 404, { success: false, message: 'Not found.' });
    } catch (error) {
      console.error('[OTP] Handler error:', error);
      sendJson(res, 500, { success: false, message: 'Server error. Try again.' });
    }
  };
}
