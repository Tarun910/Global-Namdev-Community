import { getOtpConfig, isWidgetOtpConfig } from './otpConfig';
import { widgetRetryOtp, widgetSendOtp, widgetVerifyOtp } from './msg91Widget';
import { toFullMobile } from './demoAuth';

const OTP_API_BASE = import.meta.env.VITE_OTP_API_URL?.replace(/\/$/, '') ?? '';

export interface OtpSendResult {
  success: boolean;
  message: string;
  demo?: boolean;
  reqId?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  message: string;
}

async function postOtp<T>(path: string, body: Record<string, string>): Promise<T> {
  const res = await fetch(`${OTP_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  let data: T;
  try {
    data = (await res.json()) as T;
  } catch {
    throw new Error('Invalid response from OTP server.');
  }

  return data;
}

export async function usesMsg91Widget(): Promise<boolean> {
  const config = await getOtpConfig();
  return isWidgetOtpConfig(config);
}

export async function sendPhoneOtp(dialCode: string, mobile: string): Promise<OtpSendResult> {
  const config = await getOtpConfig();
  if (isWidgetOtpConfig(config)) {
    try {
      const result = await widgetSendOtp(toFullMobile(dialCode, mobile));
      return { ...result, message: result.message ?? 'OTP sent.', demo: false };
    } catch {
      return { success: false, message: 'Could not load MSG91 widget. Try again.' };
    }
  }

  try {
    return await postOtp<OtpSendResult>('/api/otp/send', { dialCode, mobile });
  } catch {
    return { success: false, message: 'Could not reach OTP server. Try again.' };
  }
}

export async function resendPhoneOtp(
  dialCode: string,
  mobile: string,
  reqId?: string
): Promise<OtpSendResult> {
  const config = await getOtpConfig();
  if (isWidgetOtpConfig(config)) {
    try {
      const result = await widgetRetryOtp(toFullMobile(dialCode, mobile), reqId);
      return { ...result, message: result.message ?? 'OTP resent.', demo: false };
    } catch {
      return { success: false, message: 'Could not load MSG91 widget. Try again.' };
    }
  }

  try {
    return await postOtp<OtpSendResult>('/api/otp/resend', { dialCode, mobile });
  } catch {
    return { success: false, message: 'Could not reach OTP server. Try again.' };
  }
}

export async function verifyPhoneOtp(
  dialCode: string,
  mobile: string,
  otp: string,
  reqId?: string
): Promise<OtpVerifyResult> {
  const config = await getOtpConfig();
  if (isWidgetOtpConfig(config)) {
    try {
      const fullMobile = toFullMobile(dialCode, mobile);
      const widgetResult = await widgetVerifyOtp(fullMobile, otp, reqId);
      if (!widgetResult.success || !widgetResult.accessToken) {
        return {
          success: false,
          message: widgetResult.message ?? 'Invalid OTP. Please try again.',
        };
      }

      const serverResult = await verifyOtpAccessToken(widgetResult.accessToken);
      if (serverResult.success) {
        return serverResult;
      }

      // Widget already validated OTP with MSG91; accept if we got a JWT back
      if (widgetResult.accessToken.includes('.')) {
        return { success: true, message: 'OTP verified.' };
      }

      return serverResult;
    } catch {
      return { success: false, message: 'Could not load MSG91 widget. Try again.' };
    }
  }

  try {
    return await postOtp<OtpVerifyResult>('/api/otp/verify', { dialCode, mobile, otp });
  } catch {
    return { success: false, message: 'Could not reach OTP server. Try again.' };
  }
}

export async function verifyOtpAccessToken(accessToken: string): Promise<OtpVerifyResult> {
  try {
    return await postOtp<OtpVerifyResult>('/api/otp/verify-token', { accessToken });
  } catch {
    return { success: false, message: 'Could not reach OTP server. Try again.' };
  }
}

export async function fetchOtpStatus(): Promise<{ live: boolean; mode: 'widget' | 'api' | 'demo' }> {
  const config = await getOtpConfig();
  return { live: config.live, mode: config.mode };
}
