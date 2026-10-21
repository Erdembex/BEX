/** Mailbox adının başını ve alan adını bırakır, kalanını yıldızlar. */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return trimmed;

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const keep = local.length <= 2 ? 1 : 2;
  const hidden = Math.max(local.length - keep, 3);
  return `${local.slice(0, keep)}${'*'.repeat(hidden)}@${domain}`;
}
