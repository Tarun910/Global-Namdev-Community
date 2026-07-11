export const OTP_MIN_LENGTH = 4;
export const OTP_MAX_LENGTH = 6;

export function normalizeOtpInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, OTP_MAX_LENGTH);
}

export function isValidOtpCode(otp: string): boolean {
  const code = otp.trim();
  return new RegExp(`^\\d{${OTP_MIN_LENGTH},${OTP_MAX_LENGTH}}$`).test(code);
}
