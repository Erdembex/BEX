import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { Coupon } from '@/types';

type CouponDto = {
  id: string;
  businessId?: string;
  businessName?: string;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  status?: string;
  expiresAt?: string | null;
  issuedAt?: string | null;
  usedAt?: string | null;
};

function mapCouponDto(dto: CouponDto): Coupon {
  const description =
    dto.description?.trim() ||
    [dto.quantity, dto.unit, dto.rewardType].filter(Boolean).join(' ') ||
    'Kupon';
  const expiresAt = dto.expiresAt
    ? Timestamp.fromDate(new Date(dto.expiresAt))
    : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

  const statusRaw = dto.status?.toUpperCase();
  const totalUses = dto.quantity ?? 1;
  let status: Coupon['status'] = 'active';
  let usedCount = 0;

  if (statusRaw === 'DRAFT') status = 'pending';
  else if (statusRaw === 'USED' || statusRaw === 'EXHAUSTED') {
    status = 'exhausted';
    usedCount = totalUses;
  } else if (statusRaw === 'EXPIRED') status = 'expired';
  else if (statusRaw === 'SWAPPED') status = 'traded';
  else if (statusRaw === 'LOCKED_FOR_SWAP') status = 'locked';
  else if (dto.usedAt) usedCount = totalUses;

  return {
    id: String(dto.id),
    userId: '',
    businessId: dto.businessId ? String(dto.businessId) : '',
    taskId: '',
    applicationId: '',
    rewardDescription: description,
    totalUses,
    usedCount,
    qrCode: '',
    couponCode: '',
    expiresAt,
    usageHistory: [],
    status,
    createdAt: dto.issuedAt
      ? Timestamp.fromDate(new Date(dto.issuedAt))
      : Timestamp.now(),
    businessName: dto.businessName?.trim() || undefined,
    ...(dto.usedAt
      ? {
          usageHistory: [
            {
              usedAt: Timestamp.fromDate(new Date(dto.usedAt)),
              scannedBy: '',
            },
          ],
        }
      : {}),
  };
}

function mapCouponsError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) {
      return new Error('Kuponlar yalnızca bireysel hesaplar için görüntülenebilir.');
    }
    const detail = getApiErrorMessage(error, fallback);
    return new Error(status ? `[${status}] ${detail}` : detail);
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export type RestCouponStatus = 'ACTIVE' | 'LOCKED_FOR_SWAP' | 'USED' | 'SWAPPED' | 'EXPIRED' | 'DRAFT';

/** Backend kuponları — GET /api/individual/coupons (status yoksa tümü) */
export async function fetchRestCoupons(status?: RestCouponStatus): Promise<Coupon[]> {
  try {
    const { data } = await apiClient.get<CouponDto[]>('/api/individual/coupons', {
      params: status ? { status } : undefined,
    });
    return (Array.isArray(data) ? data : []).map(mapCouponDto);
  } catch (error) {
    throw mapCouponsError(error, 'Kuponlar yüklenemedi.');
  }
}

/** Tek kupon detayı — GET /api/individual/coupons/{id} */
export async function fetchRestCouponById(couponId: string): Promise<Coupon | null> {
  if (!isBackendCouponId(couponId)) return null;
  try {
    const { data } = await apiClient.get<CouponDto>(`/api/individual/coupons/${couponId}`);
    return mapCouponDto(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapCouponsError(error, 'Kupon yüklenemedi.');
  }
}

export { hasRestAuthSession };

/** Takas için uygun backend kuponları */
export async function fetchSwapEligibleCoupons(): Promise<Coupon[]> {
  const coupons = await fetchRestCoupons('ACTIVE');
  return coupons.filter((c) => c.status === 'active' && c.totalUses > c.usedCount);
}

export function isBackendCouponId(couponId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    couponId
  );
}

/** Başvuruya bağlı kupon — GET /api/individual/applications/{applicationId}/coupon */
export async function fetchCouponByApplicationId(applicationId: string): Promise<Coupon | null> {
  try {
    const { data } = await apiClient.get<CouponDto>(
      `/api/individual/applications/${applicationId}/coupon`
    );
    const coupon = mapCouponDto(data);
    return { ...coupon, applicationId: String(applicationId) };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapCouponsError(error, 'Kupon yüklenemedi.');
  }
}

type CouponQrDto = {
  couponId?: string;
  qrToken?: string;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  expiresAt?: string | null;
};

/** Kuponun doğrulama token'ı — GET /api/individual/coupons/{id}/qr */
export async function fetchCouponQrToken(couponId: string): Promise<string | null> {
  try {
    const { data } = await apiClient.get<CouponQrDto>(
      `/api/individual/coupons/${couponId}/qr`
    );
    return data.qrToken ? String(data.qrToken) : null;
  } catch (error) {
    throw mapCouponsError(error, 'Kupon QR kodu alınamadı.');
  }
}

export type CouponVerifyResult = 'SUCCESS' | 'ALREADY_USED' | 'EXPIRED' | 'LOCKED_FOR_SWAP';

export type CouponVerifyOutcome = {
  result: CouponVerifyResult;
  couponId: string;
  rewardDescription: string;
  quantity: number;
  unit: string;
};

type CouponVerifyDto = {
  result?: string;
  couponId?: string;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  usedAt?: string | null;
};

/** İşletme kupon doğrulama — POST /api/business/coupons/verify/{qrToken} */
export async function verifyCouponByToken(qrToken: string): Promise<CouponVerifyOutcome> {
  try {
    const { data } = await apiClient.post<CouponVerifyDto>(
      `/api/business/coupons/verify/${encodeURIComponent(qrToken)}`
    );
    const description =
      data.description?.trim() ||
      [data.quantity, data.unit, data.rewardType].filter(Boolean).join(' ') ||
      'Kupon';
    const resultRaw = data.result?.toUpperCase();
    const result: CouponVerifyResult =
      resultRaw === 'ALREADY_USED' || resultRaw === 'EXPIRED' || resultRaw === 'LOCKED_FOR_SWAP'
        ? resultRaw
        : 'SUCCESS';
    return {
      result,
      couponId: String(data.couponId ?? ''),
      rewardDescription: description,
      quantity: data.quantity ?? 1,
      unit: data.unit?.trim() ?? '',
    };
  } catch (error) {
    throw mapCouponsError(error, 'Kupon doğrulanamadı.');
  }
}
