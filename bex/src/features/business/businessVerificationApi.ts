import axios from 'axios';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { fetchBusinessProfile } from '@/features/auth/authApi';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Business, BusinessCategory, BusinessVerificationStatus } from '@/types';

type PendingVerificationDto = {
  profileId?: string;
  ownerUserId?: string;
  businessName?: string;
  verificationStatus?: string;
  verificationDocumentUrl?: string | null;
  verificationDocumentName?: string | null;
};

export function mapBackendVerificationStatus(
  status?: string | null,
  verified?: boolean
): BusinessVerificationStatus {
  const normalized = status?.toUpperCase() ?? '';
  if (normalized === 'PENDING') return 'pending';
  if (normalized === 'VERIFIED' || verified) return 'verified';
  if (normalized === 'REJECTED') return 'rejected';
  return 'none';
}

function mapBusinessCategory(raw?: string): BusinessCategory {
  const value = raw?.toUpperCase() ?? '';
  const map: Record<string, BusinessCategory> = {
    FOOD: 'food',
    BEAUTY: 'beauty',
    FITNESS: 'fitness',
    GYM: 'fitness',
    EDUCATION: 'education',
    RETAIL: 'retail',
    SERVICES: 'services',
    ENTERTAINMENT: 'entertainment',
    OTHER: 'other',
  };
  return map[value] ?? 'other';
}

function mapPendingToBusiness(dto: PendingVerificationDto): Business {
  const verificationStatus = mapBackendVerificationStatus(dto.verificationStatus);
  return {
    id: String(dto.profileId ?? ''),
    ownerUid: String(dto.ownerUserId ?? ''),
    name: dto.businessName?.trim() || 'İşletme',
    category: 'other',
    logoUrl: '',
    address: 'Türkiye',
    location: new GeoPoint(41.0082, 28.9784),
    isVerified: verificationStatus === 'verified',
    verificationStatus,
    verificationDocumentUrl: dto.verificationDocumentUrl
      ? resolveMediaUrl(dto.verificationDocumentUrl)
      : undefined,
    reputationScore: 0,
    totalTasksPublished: 0,
    createdAt: Timestamp.now(),
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** İşletme KYC evrakı gönder — POST /api/business/verification */
export async function submitBusinessVerificationDocument(
  documentUrl: string,
  documentName?: string
): Promise<void> {
  try {
    await apiClient.post('/api/business/verification', {
      documentUrl,
      documentName: documentName?.trim() || undefined,
    });
  } catch (error) {
    throw mapError(error, 'KYC evrakı gönderilemedi.');
  }
}

/** Admin — bekleyen KYC listesi */
export async function fetchPendingBusinessVerifications(): Promise<Business[]> {
  try {
    const { data } = await apiClient.get<PendingVerificationDto[]>(
      '/api/admin/business-verifications/pending'
    );
    if (!Array.isArray(data)) return [];
    return data.map(mapPendingToBusiness);
  } catch (error) {
    throw mapError(error, 'KYC listesi yüklenemedi.');
  }
}

export async function approveBusinessVerificationAdmin(profileId: string): Promise<void> {
  try {
    await apiClient.patch(`/api/admin/business-verifications/${profileId}/approve`);
  } catch (error) {
    throw mapError(error, 'KYC onaylanamadı.');
  }
}

export async function rejectBusinessVerificationAdmin(profileId: string): Promise<void> {
  try {
    await apiClient.patch(`/api/admin/business-verifications/${profileId}/reject`);
  } catch (error) {
    throw mapError(error, 'KYC reddedilemedi.');
  }
}

function formatBusinessAddress(profile: {
  openAddress?: string | null;
  district?: string | null;
  city?: string | null;
}): string {
  const parts = [
    profile.openAddress?.trim() ?? '',
    profile.district?.trim() ?? '',
    profile.city?.trim() ?? '',
  ].filter(Boolean);
  return parts.join(', ') || 'Türkiye';
}

/** Güncel işletme profilini Business tipine çevirir (KYC alanları dahil) */
export async function fetchBusinessWithVerification(ownerUid: string): Promise<Business | null> {
  try {
    const profile = await fetchBusinessProfile();
    const verificationStatus = mapBackendVerificationStatus(
      profile.verificationStatus,
      profile.verified
    );
    return {
      id: profile.id,
      ownerUid,
      name: profile.businessName?.trim() || 'İşletme',
      category: mapBusinessCategory(profile.category),
      logoUrl: resolveMediaUrl(profile.logoUrl?.trim() ?? ''),
      address: formatBusinessAddress(profile),
      location: new GeoPoint(41.0082, 28.9784),
      isVerified: profile.verified ?? verificationStatus === 'verified',
      verificationStatus,
      verificationDocumentUrl: profile.verificationDocumentUrl
        ? resolveMediaUrl(profile.verificationDocumentUrl)
        : undefined,
      reputationScore: 0,
      totalTasksPublished: 0,
      createdAt: Timestamp.now(),
    };
  } catch {
    return null;
  }
}
