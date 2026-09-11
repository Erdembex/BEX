import axios from 'axios';
import { Timestamp, GeoPoint } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { isBackendId } from '@/lib/api/backendId';
import { usesDemoStore } from '@/lib/restBackend';
import { EnrichedTask } from '@/features/data/businessesRepository';
import { CreateTask, Task, TaskCategory, TaskDifficulty } from '@/types';
import { formatLocationLabel } from '@/constants/turkeyLocations';
import { resolveMediaUrl } from '@/lib/mediaUrl';

type ListingCardDto = {
  id: string;
  businessProfileId?: string;
  businessName?: string;
  businessLogoUrl?: string | null;
  businessCategory?: string;
  businessCity?: string | null;
  businessDistrict?: string | null;
  businessLatitude?: number | null;
  businessLongitude?: number | null;
  businessAverageRating?: number | null;
  businessFeedbackCount?: number | null;
  businessComplaintListed?: boolean;
  businessIsDangerous?: boolean;
  businessVerified?: boolean;
  title?: string;
  skills?: string[];
  rewardType?: string;
  rewardQuantity?: number;
  rewardUnit?: string | null;
  rewardDescription?: string | null;
  status?: string;
  applicantCount?: number;
  acceptedApplicantCount?: number;
  createdAt?: string;
  expiresAt?: string;
};

type ListingDetailDto = {
  id: string;
  businessId?: string;
  businessName?: string;
  businessLogoUrl?: string | null;
  title?: string;
  description?: string;
  weeklyHours?: { min?: number; max?: number } | null;
  status?: string;
  skills?: string[];
  rewardType?: string;
  rewardQuantity?: number;
  rewardUnit?: string | null;
  validityDays?: number | null;
  rewardDescription?: string | null;
  viewCount?: number;
  createdAt?: string;
  expiresAt?: string | null;
  businessVerified?: boolean;
  businessAverageRating?: number | null;
  businessFeedbackCount?: number | null;
};

type ListingsPageDto = {
  content?: ListingCardDto[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

type ListingResponseDto = ListingDetailDto & {
  businessId?: string;
  weeklyHours?: string;
  rewardType?: string;
  rewardQuantity?: number;
  rewardUnit?: string | null;
  validityDays?: number | null;
  viewCount?: number;
  businessVerified?: boolean;
};

const CATEGORY_TO_SKILL: Record<TaskCategory, string> = {
  design: 'GRAPHIC_DESIGN',
  development: 'WEB_DESIGN',
  marketing: 'SOCIAL_MEDIA',
  content: 'WRITING',
  photography: 'PHOTOGRAPHY',
  video: 'VIDEO',
  translation: 'WRITING',
  consulting: 'OTHER',
  other: 'OTHER',
};

export function mapCategoryToBackendSkill(category: TaskCategory): string {
  return CATEGORY_TO_SKILL[category] ?? 'OTHER';
}

export { CATEGORY_TO_SKILL };

const SKILL_TO_CATEGORY: Record<string, TaskCategory> = {
  GRAPHIC_DESIGN: 'design',
  WEB_DESIGN: 'development',
  SOCIAL_MEDIA: 'marketing',
  SEO: 'marketing',
  VIDEO: 'video',
  PHOTOGRAPHY: 'photography',
  WRITING: 'content',
  MUSIC: 'other',
  OTHER: 'other',
};

function mapSkillToCategory(skills?: string[]): TaskCategory {
  const first = skills?.[0]?.toUpperCase();
  if (first && SKILL_TO_CATEGORY[first]) return SKILL_TO_CATEGORY[first];
  return 'other';
}

function mapListingStatus(status?: string): Task['status'] {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'active';
    case 'DRAFT':
      return 'draft';
    case 'CLOSED':
      return 'paused';
    case 'EXPIRED':
      return 'completed';
    default:
      return 'draft';
  }
}

/** Backend ACTIVE/CLOSED/EXPIRED — keşfette veya işletme listesinde yayınlanmış sayılır */
function isListingPublished(status?: string): boolean {
  const upper = status?.toUpperCase();
  return upper === 'ACTIVE' || upper === 'CLOSED' || upper === 'EXPIRED';
}

function formatRewardLabel(dto: {
  rewardDescription?: string | null;
  rewardQuantity?: number;
  rewardUnit?: string | null;
  rewardType?: string;
}): string {
  if (dto.rewardDescription?.trim()) return dto.rewardDescription.trim();
  const parts = [dto.rewardQuantity, dto.rewardUnit, dto.rewardType]
    .filter((part) => part !== null && part !== undefined && `${part}`.trim())
    .map(String);
  return parts.join(' ') || 'Ödül';
}

function estimateHours(weeklyHours?: { min?: number; max?: number } | null): number {
  const max = weeklyHours?.max ?? weeklyHours?.min;
  if (typeof max === 'number' && max > 0) return max;
  return 8;
}

function toTimestamp(value?: string | null): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapCardToTask(dto: ListingCardDto, businessId = ''): EnrichedTask {
  let status = mapListingStatus(dto.status);
  const deadline = toTimestamp(dto.expiresAt ?? dto.createdAt);
  if (status === 'active' && deadline.toMillis() < Date.now()) {
    status = 'completed';
  }
  const resolvedBusinessId = dto.businessProfileId
    ? String(dto.businessProfileId)
    : businessId;
  return {
    id: String(dto.id),
    businessId: resolvedBusinessId,
    title: dto.title?.trim() || 'Görev',
    description: '',
    category: mapSkillToCategory(dto.skills),
    difficulty: 'medium' as TaskDifficulty,
    estimatedHours: 8,
    rewardDescription: formatRewardLabel(dto),
    rewardQuantity: dto.rewardQuantity ?? 1,
    maxApplicants: 50,
    currentApplicantCount: dto.applicantCount ?? 0,
    acceptedApplicantCount: dto.acceptedApplicantCount ?? 0,
    status,
    location: new GeoPoint(41.0082, 28.9784),
    deadline,
    createdAt: toTimestamp(dto.createdAt),
    approvedByAdmin: isListingPublished(dto.status),
    featured: false,
    businessName: dto.businessName?.trim() || 'İşletme',
    businessLogoUrl: resolveMediaUrl(dto.businessLogoUrl?.trim() ?? ''),
    businessVerified: dto.businessVerified ?? false,
    businessIsDangerous: dto.businessIsDangerous ?? false,
    businessComplaintListed: dto.businessComplaintListed ?? false,
    locationLabel: formatLocationLabel(dto.businessCity, dto.businessDistrict),
    businessLatitude: dto.businessLatitude ?? undefined,
    businessLongitude: dto.businessLongitude ?? undefined,
    businessAverageRating: dto.businessAverageRating ?? undefined,
    businessFeedbackCount: dto.businessFeedbackCount ?? undefined,
  };
}

function mapResponseToTask(dto: ListingResponseDto): EnrichedTask {
  let status = mapListingStatus(dto.status);
  const deadline = toTimestamp(dto.expiresAt ?? dto.createdAt);
  if (status === 'active' && deadline.toMillis() < Date.now()) {
    status = 'completed';
  }
  return {
    id: String(dto.id),
    businessId: dto.businessId ? String(dto.businessId) : '',
    title: dto.title?.trim() || 'Görev',
    description: dto.description?.trim() || '',
    category: mapSkillToCategory(dto.skills),
    difficulty: 'medium',
    estimatedHours: estimateHours(dto.weeklyHours as { min?: number; max?: number } | null),
    rewardDescription: formatRewardLabel(dto),
    rewardQuantity: dto.rewardQuantity ?? 1,
    maxApplicants: 50,
    currentApplicantCount: 0,
    status,
    location: new GeoPoint(41.0082, 28.9784),
    deadline,
    createdAt: toTimestamp(dto.createdAt),
    approvedByAdmin: isListingPublished(dto.status),
    featured: false,
    businessName: dto.businessName?.trim() || 'İşletme',
    businessLogoUrl: resolveMediaUrl(dto.businessLogoUrl?.trim() ?? ''),
    businessVerified: dto.businessVerified ?? false,
    businessAverageRating: dto.businessAverageRating ?? undefined,
    businessFeedbackCount: dto.businessFeedbackCount ?? undefined,
  };
}

function mapDetailToTask(dto: ListingDetailDto): EnrichedTask {
  return mapResponseToTask(dto as ListingResponseDto);
}

function mapHoursToWeekly(hours: number): string {
  if (hours <= 3) return 'H1_3';
  if (hours <= 5) return 'H3_5';
  if (hours <= 10) return 'H5_10';
  return 'H10_PLUS';
}

function mapCreateTaskToRequest(data: CreateTask) {
  const deadlineMs = data.deadline?.toMillis?.() ?? Date.now() + 14 * 86400000;
  return {
    title: data.title.trim(),
    description: data.description.trim(),
    weeklyHours: mapHoursToWeekly(data.estimatedHours || 4),
    skills: [CATEGORY_TO_SKILL[data.category] ?? 'OTHER'],
    reward: {
      rewardType: 'CUSTOM',
      quantity: data.rewardQuantity || 1,
      unit: 'adet',
      validityDays: Math.max(
        1,
        Math.ceil((deadlineMs - Date.now()) / 86400000)
      ),
      description: data.rewardDescription.trim(),
    },
    expiresAt: new Date(deadlineMs).toISOString(),
  };
}

function mapPartialTaskToUpdate(data: CreateTask) {
  const base = mapCreateTaskToRequest(data);
  return {
    title: base.title,
    description: base.description,
    weeklyHours: base.weeklyHours,
    skills: base.skills,
    rewardType: base.reward.rewardType,
    quantity: base.reward.quantity,
    unit: base.reward.unit,
    validityDays: base.reward.validityDays,
    rewardDescription: base.reward.description,
    expiresAt: base.expiresAt,
  };
}

function mapListingsError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = getApiErrorMessage(error, fallback);
    return new Error(status ? `[${status}] ${detail}` : detail);
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export { isBackendId };

export type DiscoverListingsResult = {
  tasks: EnrichedTask[];
  nextCursor: string | null;
};

/** Keşfet — GET /api/listings */
export async function discoverListings(options?: {
  pageSize?: number;
  cursor?: string;
  city?: string;
  district?: string;
  skills?: string[];
  q?: string;
  rewardType?: string;
}): Promise<DiscoverListingsResult> {
  try {
    const { data } = await apiClient.get<ListingsPageDto>('/api/listings', {
      params: {
        pageSize: options?.pageSize ?? 20,
        cursor: options?.cursor,
        city: options?.city || undefined,
        district: options?.district || undefined,
        skills: options?.skills?.length ? options.skills : undefined,
        q: options?.q?.trim() || undefined,
        rewardType: options?.rewardType || undefined,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
    const content = Array.isArray(data?.content) ? data.content : [];
    return {
      tasks: content.map((item) => mapCardToTask(item)),
      nextCursor: data?.nextCursor ?? null,
    };
  } catch (error) {
    throw mapListingsError(error, 'Görevler yüklenemedi.');
  }
}

/** İlan detayı — GET /api/listings/{id} */
export async function fetchListingDetail(listingId: string): Promise<EnrichedTask | null> {
  if (!isBackendId(listingId)) return null;
  try {
    const { data } = await apiClient.get<ListingDetailDto>(`/api/listings/${listingId}`);
    return mapDetailToTask(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapListingsError(error, 'Görev detayı yüklenemedi.');
  }
}

/** İşletme ilanları — GET /api/business/listings */
export async function fetchBusinessListings(): Promise<EnrichedTask[]> {
  try {
    const { data } = await apiClient.get<ListingCardDto[]>('/api/business/listings');
    const cards = Array.isArray(data) ? data : [];
    return cards.map((item) => mapCardToTask(item, item.id ? '' : ''));
  } catch (error) {
    throw mapListingsError(error, 'İşletme görevleri yüklenemedi.');
  }
}

/** POST /api/business/listings */
export async function createListing(data: CreateTask): Promise<EnrichedTask> {
  try {
    const { data: response } = await apiClient.post<ListingResponseDto>(
      '/api/business/listings',
      mapCreateTaskToRequest(data)
    );
    return mapResponseToTask(response);
  } catch (error) {
    throw mapListingsError(error, 'Görev oluşturulamadı.');
  }
}

/** PATCH /api/admin/listings/{id}/approve */
export async function approveListingAsAdmin(listingId: string): Promise<EnrichedTask> {
  try {
    const { data } = await apiClient.patch<ListingResponseDto>(
      `/api/admin/listings/${listingId}/approve`
    );
    return mapResponseToTask(data);
  } catch (error) {
    throw mapListingsError(error, 'Görev onaylanamadı.');
  }
}

/** PATCH /api/admin/listings/{id}/reject */
export async function rejectListingAsAdmin(listingId: string): Promise<void> {
  try {
    await apiClient.patch(`/api/admin/listings/${listingId}/reject`);
  } catch (error) {
    throw mapListingsError(error, 'Görev reddedilemedi.');
  }
}

/** GET /api/admin/listings/pending */
export async function fetchPendingAdminListings(): Promise<EnrichedTask[]> {
  try {
    const { data } = await apiClient.get<ListingCardDto[]>('/api/admin/listings/pending');
    return (Array.isArray(data) ? data : []).map((item) => mapCardToTask(item));
  } catch (error) {
    throw mapListingsError(error, 'Onay bekleyen görevler yüklenemedi.');
  }
}

/** @deprecated İşletme yayınlayamaz — admin onayı gerekir */
export async function publishListing(listingId: string): Promise<EnrichedTask> {
  return approveListingAsAdmin(listingId);
}

/** PUT /api/business/listings/{id} */
export async function updateListing(listingId: string, data: CreateTask): Promise<EnrichedTask> {
  try {
    const { data: response } = await apiClient.put<ListingResponseDto>(
      `/api/business/listings/${listingId}`,
      mapPartialTaskToUpdate(data)
    );
    return mapResponseToTask(response);
  } catch (error) {
    throw mapListingsError(error, 'Görev güncellenemedi.');
  }
}

/** PATCH /api/business/listings/{id}/publish */
export async function publishBusinessListing(listingId: string): Promise<EnrichedTask> {
  try {
    const { data } = await apiClient.patch<ListingResponseDto>(
      `/api/business/listings/${listingId}/publish`
    );
    return mapResponseToTask(data);
  } catch (error) {
    throw mapListingsError(error, 'Görev yayınlanamadı.');
  }
}

/** PATCH /api/business/listings/{id}/close */
export async function closeListing(listingId: string): Promise<void> {
  try {
    await apiClient.patch(`/api/business/listings/${listingId}/close`);
  } catch (error) {
    throw mapListingsError(error, 'Görev kapatılamadı.');
  }
}

export async function shouldUseListingsRest(): Promise<boolean> {
  return !usesDemoStore();
}
