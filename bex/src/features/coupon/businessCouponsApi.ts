import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { formatCouponCodeFromId } from '@/lib/couponCode';
import { Coupon } from '@/types';

type CouponDto = {
  id?: string;
  businessId?: string;
  businessName?: string | null;
  rewardType?: string;
  quantity?: number;
  unit?: string | null;
  description?: string | null;
  status?: string;
  issuedAt?: string;
  expiresAt?: string;
  usedAt?: string | null;
};

function mapCouponStatus(status?: string, usedAt?: string | null, quantity = 1): {
  status: Coupon['status'];
  usedCount: number;
} {
  const key = status?.toUpperCase() ?? '';
  const total = quantity ?? 1;
  if (key === 'DRAFT') return { status: 'pending', usedCount: 0 };
  if (key === 'USED' || key === 'EXHAUSTED') return { status: 'exhausted', usedCount: total };
  if (key === 'EXPIRED') return { status: 'expired', usedCount: 0 };
  if (key === 'SWAPPED') return { status: 'traded', usedCount: 0 };
  if (usedAt) return { status: 'exhausted', usedCount: total };
  return { status: 'active', usedCount: 0 };
}

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

export function mapCouponDto(
  dto: CouponDto,
  applicationId: string,
  taskId: string,
  userId: string
): Coupon {
  const description =
    dto.description?.trim() ||
    [dto.quantity, dto.unit, dto.rewardType].filter(Boolean).join(' ') ||
    'Ödül';

  const totalUses = dto.quantity ?? 1;
  const mapped = mapCouponStatus(dto.status, dto.usedAt, totalUses);

  return {
    id: String(dto.id),
    userId,
    businessId: String(dto.businessId ?? ''),
    taskId,
    applicationId,
    rewardDescription: description,
    totalUses,
    usedCount: mapped.usedCount,
    qrCode: String(dto.id),
    couponCode: formatCouponCodeFromId(String(dto.id)),
    expiresAt: toTimestamp(dto.expiresAt),
    usageHistory: [],
    status: mapped.status,
    createdAt: toTimestamp(dto.issuedAt),
    businessName: dto.businessName?.trim() || undefined,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** POST /api/business/applications/{id}/issue-coupon */
export async function issueBusinessCoupon(
  applicationId: string,
  note?: string
): Promise<CouponDto> {
  try {
    const { data } = await apiClient.post<CouponDto>(
      `/api/business/applications/${applicationId}/issue-coupon`,
      null,
      { params: note?.trim() ? { note: note.trim() } : undefined }
    );
    return data;
  } catch (error) {
    throw mapError(error, 'Kupon oluşturulamadı.');
  }
}

type IssuedCouponDto = CouponDto & {
  usedAt?: string | null;
  recipientName?: string | null;
};

/** İşletmenin dağıttığı bir kupon kaydı (geçmiş/istatistik için) */
export type BusinessIssuedCoupon = {
  id: string;
  rewardDescription: string;
  quantity: number;
  /** ham backend durumu */
  statusRaw: 'DRAFT' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'SWAPPED';
  issuedAt: Timestamp | null;
  usedAt: Timestamp | null;
  recipientName: string | null;
};

const ISSUED_STATUSES = ['ACTIVE', 'USED', 'EXPIRED', 'SWAPPED'] as const;

function toTimestampOrNull(value?: string | null): Timestamp | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : Timestamp.fromDate(date);
}

function mapIssuedCoupon(dto: IssuedCouponDto): BusinessIssuedCoupon {
  const rewardDescription =
    dto.description?.trim() ||
    [dto.quantity, dto.unit, dto.rewardType].filter(Boolean).join(' ') ||
    'Ödül';
  const statusRaw = (dto.status?.toUpperCase() ?? 'ACTIVE') as BusinessIssuedCoupon['statusRaw'];
  return {
    id: String(dto.id),
    rewardDescription,
    quantity: dto.quantity ?? 1,
    statusRaw,
    issuedAt: toTimestampOrNull(dto.issuedAt),
    usedAt: toTimestampOrNull(dto.usedAt),
    recipientName: dto.recipientName?.trim() || null,
  };
}

/**
 * İşletmenin dağıttığı TÜM kuponlar (her durum için ayrı sorgu birleştirilir).
 * Backend /api/business/coupons/issued tek seferde tek durum döndürür.
 */
export async function fetchIssuedCoupons(): Promise<BusinessIssuedCoupon[]> {
  try {
    const batches = await Promise.all(
      ISSUED_STATUSES.map((status) =>
        apiClient
          .get<IssuedCouponDto[]>('/api/business/coupons/issued', { params: { status } })
          .then((r) => (Array.isArray(r.data) ? r.data : []))
          .catch(() => [] as IssuedCouponDto[])
      )
    );
    return batches
      .flat()
      .map(mapIssuedCoupon)
      .sort((a, b) => (b.issuedAt?.toMillis() ?? 0) - (a.issuedAt?.toMillis() ?? 0));
  } catch (error) {
    throw mapError(error, 'Dağıtılan kuponlar yüklenemedi.');
  }
}
