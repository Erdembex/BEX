import { useMemo } from 'react';
import { Coupon } from '@/types';
import { useTranslation } from '@/i18n';

export interface CouponQrPayload {
  couponId: string;
  businessId: string;
  hash: string;
  issuedAt: number;
}

export function buildCouponQrPayload(coupon: Coupon): CouponQrPayload {
  return {
    couponId: coupon.id,
    businessId: coupon.businessId,
    hash: coupon.qrCode || coupon.id,
    issuedAt: coupon.createdAt.toMillis(),
  };
}

function encodeUtf8Base64(text: string): string {
  if (typeof globalThis.btoa === 'function') {
    return globalThis.btoa(unescape(encodeURIComponent(text)));
  }
  const bytes = new TextEncoder().encode(text);
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? alphabet[triple & 63] : '=';
  }
  return output;
}

function decodeUtf8Base64(encoded: string): string {
  if (typeof globalThis.atob === 'function') {
    return decodeURIComponent(escape(globalThis.atob(encoded)));
  }
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const normalized = encoded.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < normalized.length; i += 4) {
    const a = alphabet.indexOf(normalized[i] ?? 'A');
    const b = alphabet.indexOf(normalized[i + 1] ?? 'A');
    const c = alphabet.indexOf(normalized[i + 2] ?? '=');
    const d = alphabet.indexOf(normalized[i + 3] ?? '=');
    const triple = (a << 18) | (b << 12) | ((c >= 0 ? c : 0) << 6) | (d >= 0 ? d : 0);
    bytes.push((triple >> 16) & 255);
    if (normalized[i + 2] !== '=') bytes.push((triple >> 8) & 255);
    if (normalized[i + 3] !== '=') bytes.push(triple & 255);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function encodeCouponQr(coupon: Coupon): string {
  const json = JSON.stringify(buildCouponQrPayload(coupon));
  return encodeUtf8Base64(json);
}

export function decodeCouponQr(raw: string): CouponQrPayload | null {
  try {
    let json = raw.trim();
    if (!json.startsWith('{')) {
      json = decodeUtf8Base64(json);
    }
    const parsed = JSON.parse(json) as CouponQrPayload;
    if (parsed.couponId && parsed.businessId && parsed.hash) {
      return parsed;
    }
  } catch {
    // Geçersiz QR
  }
  return null;
}

/** QR veya düz kupon kodundan lookup bilgisi çıkarır */
export function parseCouponScan(raw: string): {
  couponId?: string;
  couponCode?: string;
} | null {
  const payload = decodeCouponQr(raw);
  if (payload) return { couponId: payload.couponId };

  const code = raw.trim().toUpperCase();
  // PS- yeni marka; BEX- eski kuponlar için geriye dönük uyumluluk.
  if (code.startsWith('PS-') || code.startsWith('BEX-')) return { couponCode: code };

  return null;
}

export function getCouponRemainingUses(coupon: Coupon): number {
  return Math.max(0, coupon.totalUses - coupon.usedCount);
}

export function isCouponExpired(coupon: Coupon): boolean {
  return coupon.expiresAt.toMillis() < Date.now();
}

export function getCouponDisplayStatus(
  coupon: Coupon
): 'active' | 'pending' | 'exhausted' | 'expired' | 'traded' | 'locked' {
  if (coupon.status === 'locked') return 'locked';
  if (coupon.status === 'pending') return 'pending';
  if (coupon.status === 'traded') return 'traded';
  if (coupon.status === 'exhausted') return 'exhausted';
  if (coupon.status === 'expired' || isCouponExpired(coupon)) return 'expired';
  return 'active';
}

const EXPIRING_SOON_MS = 3 * 24 * 60 * 60 * 1000;

export function isCouponExpiringSoon(coupon: Coupon): boolean {
  if (getCouponDisplayStatus(coupon) !== 'active') return false;
  const remaining = coupon.expiresAt.toMillis() - Date.now();
  return remaining > 0 && remaining <= EXPIRING_SOON_MS;
}

/** @deprecated Yerine useCouponStatusLabels kullan */
export const COUPON_STATUS_LABELS = {
  active: 'Aktif',
  pending: 'Aktivasyon bekliyor',
  locked: 'Takasta kilitli',
  exhausted: 'Tükendi',
  expired: 'Süresi doldu',
  traded: 'Takas edildi',
} as const;

export function useCouponStatusLabels() {
  const { t } = useTranslation();
  return useMemo(
    () => ({
      active: t('coupon.statusActive'),
      pending: t('coupon.statusPending'),
      locked: t('coupon.statusLocked'),
      exhausted: t('coupon.statusExhausted'),
      expired: t('coupon.statusExpired'),
      traded: t('coupon.statusTraded'),
    }),
    [t]
  );
}
