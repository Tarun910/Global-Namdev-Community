export interface AuthSession {
  mobileNumber: string;
  mobileCountryCode?: string;
  registrationId: string;
  loggedInAt: string;
}

const SESSION_KEY = 'gnc_session';

export function normalizeMobile(mobile: string): string {
  return mobile.replace(/\D/g, '');
}

export function normalizeDialCode(dialCode: string): string {
  const digits = dialCode.replace(/\D/g, '');
  return digits ? `+${digits}` : '+91';
}

export function toFullMobile(dialCode: string, localMobile: string): string {
  const code = dialCode.replace(/\D/g, '');
  const local = normalizeMobile(localMobile);
  return `${code}${local}`;
}

export function getRegistrationDialCode(registration: { mobileCountryCode?: string }): string {
  return registration.mobileCountryCode ?? '+91';
}

export function findRegistrationByMobile(
  registrations: { mobileNumber: string; mobileCountryCode?: string; id: string }[],
  dialCode: string,
  localMobile: string
) {
  const local = normalizeMobile(localMobile);
  const normalizedDial = normalizeDialCode(dialCode);

  return registrations.find((registration) => {
    const regDial = normalizeDialCode(getRegistrationDialCode(registration));
    const regLocal = normalizeMobile(registration.mobileNumber);
    if (regDial === normalizedDial) {
      return regLocal === local;
    }
    // Legacy records without country code (India +91, 10-digit)
    if (!registration.mobileCountryCode && normalizedDial === '+91') {
      return regLocal === local || regLocal.slice(-10) === local.slice(-10);
    }
    return false;
  });
}

export function isValidLocalMobile(localMobile: string): boolean {
  const digits = normalizeMobile(localMobile);
  return digits.length >= 6 && digits.length <= 15;
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
