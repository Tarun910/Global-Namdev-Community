const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*[\p{L}\p{M}]?$|^[\p{L}\p{M}]$/u;
const LOCATION_TEXT_PATTERN = /^[\p{L}\p{M}0-9][\p{L}\p{M}0-9\s.,/'()-]{0,98}$/u;
const DOB_PATTERN = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && PERSON_NAME_PATTERN.test(trimmed);
}

export function isValidOptionalPersonName(value?: string): boolean {
  if (!value?.trim()) return true;
  return isValidPersonName(value);
}

export function isValidLocationText(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && LOCATION_TEXT_PATTERN.test(trimmed);
}

export function isValidDobOrAge(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const match = trimmed.match(DOB_PATTERN);
  if (!match) return false;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) return false;

  const parsed = new Date(year, month - 1, day);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed <= new Date()
  );
}

export function isValidRequiredText(value: string, minLength = 2): boolean {
  return value.trim().length >= minLength;
}

export function isValidForumTitle(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.length <= 120;
}

export function isValidForumContent(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 10 && trimmed.length <= 5000;
}

export function isValidForumComment(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && trimmed.length <= 1000;
}

export function isValidAdminUsername(value: string): boolean {
  const trimmed = value.trim();
  return /^[a-zA-Z0-9._-]{3,32}$/.test(trimmed);
}

export function isValidAdminPassword(value: string): boolean {
  return value.length >= 6;
}

export function isValidVerifyQuery(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 3) return false;
  if (/^GNC-\d{4}-\d{6}$/i.test(trimmed)) return true;
  return /^\d{6,15}$/.test(trimmed.replace(/\D/g, ''));
}

export function isValidBulletinTitle(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 3 && trimmed.length <= 120;
}

export function isValidBulletinMessage(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 10 && trimmed.length <= 2000;
}
