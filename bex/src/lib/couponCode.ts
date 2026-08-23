export function generateCouponCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PS-${part()}-${part()}`;
}

/** REST/Firestore id'den görüntüleme kodu (PS-XXXXXXXX). */
export function formatCouponCodeFromId(id: string): string {
  const compact = id.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `PS-${compact}`;
}
