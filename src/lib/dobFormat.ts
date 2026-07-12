const DOB_PATTERN = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;

export function parseDobToIso(value: string): string | null {
  const match = value.trim().match(DOB_PATTERN);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function formatIsoToDob(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
}

export function todayIsoDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
