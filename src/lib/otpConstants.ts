export const OTP_LENGTH = 4;

export function normalizeOtpInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function isValidOtpCode(otp: string): boolean {
  return /^\d{4}$/.test(otp.trim());
}
