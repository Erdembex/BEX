/** Yazarken GG.AA.YYYY. Noktayı kullanıcı basmaz; gün ve aydan sonra kendisi gelir. */
export function formatBirthDateTyping(next: string, previous = ''): string {
  const prevDigits = previous.replace(/\D/g, '').slice(0, 8);
  let digits = next.replace(/\D/g, '').slice(0, 8);

  if (next.length < previous.length && digits === prevDigits && prevDigits.length > 0) {
    const removedAt = indexOfFirstDifference(previous, next);
    const digitsBeforeSeparator = previous.slice(0, removedAt).replace(/\D/g, '').length;
    const dropAt = Math.max(0, digitsBeforeSeparator - 1);
    digits = prevDigits.slice(0, dropAt) + prevDigits.slice(dropAt + 1);
  }

  return applyBirthDateMask(digits);
}

function indexOfFirstDifference(previous: string, next: string): number {
  const limit = Math.min(previous.length, next.length);
  for (let i = 0; i < limit; i += 1) {
    if (previous[i] !== next[i]) return i;
  }
  return next.length;
}

function applyBirthDateMask(digits: string): string {
  const d = digits.slice(0, 8);
  if (d.length <= 1) return d;
  if (d.length === 2) return `${d}.`;
  if (d.length === 3) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length === 4) return `${d.slice(0, 2)}.${d.slice(2)}.`;
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}

/** ISO (YYYY-MM-DD) veya GG.AA.YYYY formatında doğum tarihi ayrıştırır. */
export function parseBirthDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return buildValidDate(year, month, day);
  }

  const trMatch = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(trimmed);
  if (trMatch) {
    const day = Number(trMatch[1]);
    const month = Number(trMatch[2]);
    const year = Number(trMatch[3]);
    return buildValidDate(year, month, day);
  }

  return null;
}

function buildValidDate(year: number, month: number, day: number): Date | null {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function calculateAge(birthDate: Date, reference = new Date()): number {
  let age = reference.getFullYear() - birthDate.getFullYear();
  const monthDiff = reference.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export function formatBirthDateIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatBirthDateDisplay(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

export const MIN_REGISTRATION_AGE = 13;

export function isRegistrationAgeValid(birthDate: Date, reference = new Date()): boolean {
  return calculateAge(birthDate, reference) >= MIN_REGISTRATION_AGE;
}
