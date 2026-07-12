import { getOtpConfig, isWidgetOtpConfig } from './otpConfig';
import { clearOtpReqId, loadOtpReqId, storeOtpReqId } from './otpSession';

const WIDGET_SCRIPT = 'https://verify.msg91.com/otp-provider.js';
const CAPTCHA_ID = 'msg91-captcha';
const METHOD_WAIT_MS = 12000;

type WidgetCallback = (data: Msg91WidgetResponse) => void;
type WidgetErrorCallback = (error: Msg91WidgetResponse) => void;

interface Msg91WidgetResponse {
  message?: string;
  reqId?: string;
  request_id?: string;
  requestId?: string;
  identifier?: string;
  token?: string;
  type?: string;
  ['access-token']?: string;
}

type WidgetMethod = 'sendOtp' | 'retryOtp' | 'verifyOtp';

declare global {
  interface Window {
    sendOtp?: (
      identifier: string,
      onSuccess?: WidgetCallback,
      onFailure?: WidgetErrorCallback
    ) => void;
    retryOtp?: (
      channel: string | null,
      onSuccess?: WidgetCallback,
      onFailure?: WidgetErrorCallback,
      reqId?: string
    ) => void;
    verifyOtp?: (
      otp: string | number,
      onSuccess?: WidgetCallback,
      onFailure?: WidgetErrorCallback,
      reqId?: string
    ) => void;
    initSendOTP?: (configuration: Record<string, unknown>) => void;
    isCaptchaVerified?: () => boolean;
    getWidgetData?: () => Msg91WidgetResponse;
  }
}

let initPromise: Promise<void> | null = null;
let activeWidgetId: string | null = null;
let widgetReady = false;

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Ensure a captcha mount exists (visible or hidden) for first-time widget init */
function ensureCaptchaElement(): HTMLElement {
  const existing = document.getElementById(CAPTCHA_ID);
  if (existing?.isConnected) return existing;

  const el = existing ?? document.createElement('div');
  el.id = CAPTCHA_ID;
  el.className = 'flex justify-center w-full';
  if (!el.isConnected) {
    el.setAttribute('data-msg91-host', 'fallback');
    document.body.appendChild(el);
  }
  return el;
}

function getWidgetMethod(name: WidgetMethod): Function | undefined {
  const candidates = [name, name.charAt(0).toUpperCase() + name.slice(1)];
  for (const key of candidates) {
    const fn = (window as unknown as Record<string, unknown>)[key];
    if (typeof fn === 'function') {
      return fn as Function;
    }
  }
  return undefined;
}

function isWidgetMethodsReady(): boolean {
  return Boolean(getWidgetMethod('sendOtp') && getWidgetMethod('verifyOtp'));
}

function waitForWidgetMethod(method: WidgetMethod): Promise<void> {
  return new Promise((resolve, reject) => {
    const started = Date.now();

    const check = () => {
      if (getWidgetMethod(method)) {
        resolve();
        return;
      }
      if (Date.now() - started > METHOD_WAIT_MS) {
        reject(new Error(`MSG91 ${method} is not available.`));
        return;
      }
      window.setTimeout(check, 100);
    };

    check();
  });
}

function buildConfiguration(config: { widgetId: string; tokenAuth: string }) {
  return {
    widgetId: config.widgetId,
    tokenAuth: config.tokenAuth,
    exposeMethods: true,
    captchaRenderId: CAPTCHA_ID,
    success: () => {},
    failure: () => {},
  };
}

function loadWidgetScript(): Promise<void> {
  const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = WIDGET_SCRIPT;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MSG91 OTP widget.'));
    document.body.appendChild(script);
  });
}

function widgetErrorMessage(error: Msg91WidgetResponse | undefined, fallback: string): string {
  if (!error) return fallback;
  if (typeof error.message === 'string' && error.message.trim()) {
    if (error.message === 'AuthenticationFailure') {
      return 'OTP session expired. Tap Resend OTP or go back and send again.';
    }
    return error.message;
  }
  return fallback;
}

function looksLikeJwt(value: string): boolean {
  return value.includes('.') && value.split('.').length >= 2;
}

function looksLikeReqId(value: string): boolean {
  return !looksLikeJwt(value) && value.length >= 8;
}

export function extractReqId(data: Msg91WidgetResponse | undefined): string | undefined {
  if (!data) return undefined;

  const direct = data.reqId ?? data.request_id ?? data.requestId;
  if (direct) return String(direct);

  if (typeof data.message === 'string' && looksLikeReqId(data.message)) {
    return data.message;
  }

  return undefined;
}

function extractAccessToken(data: Msg91WidgetResponse | undefined): string | undefined {
  if (!data) return undefined;

  if (typeof data['access-token'] === 'string') return data['access-token'];
  if (typeof data.token === 'string') return data.token;
  if (typeof data.message === 'string' && looksLikeJwt(data.message)) {
    return data.message;
  }

  return undefined;
}

function resolveReqId(identifier: string, reqId?: string): string | undefined {
  if (reqId) return reqId;

  const stored = loadOtpReqId(identifier);
  if (stored) return stored;

  if (typeof window.getWidgetData === 'function') {
    try {
      return extractReqId(window.getWidgetData());
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function runWidgetInit(config: { widgetId: string; tokenAuth: string }): void {
  if (typeof window.initSendOTP !== 'function') {
    throw new Error('MSG91 widget failed to initialize.');
  }
  window.initSendOTP(buildConfiguration(config));
}

export async function initMsg91Widget(): Promise<void> {
  const config = await getOtpConfig();
  if (!isWidgetOtpConfig(config)) {
    throw new Error('MSG91 widget is not configured.');
  }

  if (widgetReady && isWidgetMethodsReady() && activeWidgetId === config.widgetId) {
    return;
  }

  if (initPromise && activeWidgetId === config.widgetId) {
    return initPromise;
  }

  activeWidgetId = config.widgetId!;
  const widgetConfig = { widgetId: config.widgetId!, tokenAuth: config.tokenAuth! };

  initPromise = (async () => {
    ensureCaptchaElement();
    await waitForPaint();
    await loadWidgetScript();

    if (!isWidgetMethodsReady()) {
      runWidgetInit(widgetConfig);
      await waitForWidgetMethod('sendOtp');
    }

    widgetReady = true;
  })();

  try {
    await initPromise;
  } catch (error) {
    initPromise = null;
    widgetReady = false;
    throw error;
  }
}

function isCaptchaVisible(): boolean {
  const el = document.getElementById(CAPTCHA_ID);
  if (!el) return false;
  if (el.getAttribute('data-msg91-host') === 'fallback') return false;
  return el.querySelector('iframe') !== null || el.children.length > 0;
}

export interface WidgetSendResult {
  success: boolean;
  message?: string;
  reqId?: string;
}

export async function widgetSendOtp(identifier: string): Promise<WidgetSendResult> {
  try {
    await initMsg91Widget();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initialize MSG91 widget.';
    return { success: false, message };
  }

  if (
    isCaptchaVisible() &&
    typeof window.isCaptchaVerified === 'function' &&
    !window.isCaptchaVerified()
  ) {
    return {
      success: false,
      message: 'Please tick the captcha checkbox, then tap Send OTP again.',
    };
  }

  const sendOtp = getWidgetMethod('sendOtp');
  if (!sendOtp) {
    return {
      success: false,
      message: 'MSG91 sendOtp is not available. Refresh the page and try again.',
    };
  }

  return new Promise((resolve) => {
    sendOtp(
      identifier,
      (data: Msg91WidgetResponse) => {
        let reqId = extractReqId(data);
        if (!reqId && typeof window.getWidgetData === 'function') {
          reqId = extractReqId(window.getWidgetData());
        }
        if (reqId) {
          storeOtpReqId(identifier, reqId);
        }
        resolve({
          success: true,
          reqId,
          message: 'OTP sent to your mobile number.',
        });
      },
      (error: Msg91WidgetResponse) => {
        resolve({
          success: false,
          message: widgetErrorMessage(error, 'Could not send OTP. Try again.'),
        });
      }
    );
  });
}

export async function widgetRetryOtp(identifier: string, reqId?: string): Promise<WidgetSendResult> {
  const activeReqId = resolveReqId(identifier, reqId);

  try {
    await initMsg91Widget();
  } catch (error) {
    if (!isWidgetMethodsReady()) {
      const message = error instanceof Error ? error.message : 'Could not initialize MSG91 widget.';
      return { success: false, message };
    }
  }

  // No session id — send a fresh OTP instead of retry
  if (!activeReqId) {
    return widgetSendOtp(identifier);
  }

  const retryOtp = getWidgetMethod('retryOtp');
  if (!retryOtp) {
    return widgetSendOtp(identifier);
  }

  return new Promise((resolve) => {
    retryOtp(
      null,
      (data: Msg91WidgetResponse) => {
        const nextReqId = extractReqId(data) ?? activeReqId;
        if (nextReqId) {
          storeOtpReqId(identifier, nextReqId);
        }
        resolve({
          success: true,
          reqId: nextReqId,
          message: 'OTP resent to your mobile number.',
        });
      },
      (error: Msg91WidgetResponse) => {
        resolve({
          success: false,
          message: widgetErrorMessage(error, 'Could not resend OTP. Try again.'),
        });
      },
      activeReqId
    );
  });
}

export interface WidgetVerifyResult {
  success: boolean;
  accessToken?: string;
  identifier?: string;
  message?: string;
}

export async function widgetVerifyOtp(
  identifier: string,
  otp: string,
  reqId?: string
): Promise<WidgetVerifyResult> {
  const activeReqId = resolveReqId(identifier, reqId);

  if (!activeReqId) {
    return {
      success: false,
      message: 'OTP session expired. Tap Resend OTP or go back and send again.',
    };
  }

  try {
    await initMsg91Widget();
  } catch (error) {
    if (!isWidgetMethodsReady()) {
      const message = error instanceof Error ? error.message : 'Could not initialize MSG91 widget.';
      return { success: false, message };
    }
  }

  const verifyOtp = getWidgetMethod('verifyOtp');
  if (!verifyOtp) {
    return { success: false, message: 'MSG91 verifyOtp is not available.' };
  }

  return new Promise((resolve) => {
    verifyOtp(
      String(otp).trim(),
      (data: Msg91WidgetResponse) => {
        const accessToken = extractAccessToken(data);
        if (!accessToken) {
          resolve({ success: false, message: 'OTP verified but no access token received.' });
          return;
        }
        clearOtpReqId(identifier);
        resolve({
          success: true,
          accessToken,
          identifier: data.identifier ?? identifier,
          message: 'OTP verified.',
        });
      },
      (error: Msg91WidgetResponse) => {
        resolve({
          success: false,
          message: widgetErrorMessage(error, 'Invalid OTP. Please try again.'),
        });
      },
      activeReqId
    );
  });
}
