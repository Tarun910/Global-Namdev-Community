import type { OtpSendResult } from './phoneOtp';

const FALLBACK_PATTERNS = [
  'too many',
  'limit',
  'could not',
  'failed',
  'unavailable',
  'not configured',
  'try again',
  'reach otp',
  'msg91',
  'network',
  'timeout',
];

export function isOtpFallbackEligible(result: Pick<OtpSendResult, 'success' | 'message'>): boolean {
  if (result.success) return false;
  const message = result.message.toLowerCase();
  return FALLBACK_PATTERNS.some((pattern) => message.includes(pattern));
}

export function otpUnavailableMessage(language: 'en' | 'hi'): string {
  if (language === 'hi') {
    return 'OTP भेजा नहीं जा सका। कृपया अपने पासवर्ड से जारी रखें।';
  }
  return 'OTP could not be sent. Please continue with your password instead.';
}
