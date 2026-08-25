import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { isBackendId } from '@/lib/api/backendId';
import { getSessionClaims, hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { PortfolioItem, CompletedTask } from '@/types';

export type PublicProfileDto = {
  profileId?: string;
  userId?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  completedTaskCount?: number;
  averageRating?: number;
  feedbackCount?: number;
  approvedComplaintCount?: number;
  complaintRate?: number;
  isDangerous?: boolean;
  completedTasks?: Array<{
    applicationId?: string;
    listingTitle?: string;
    completedAt?: string;
    imageCount?: number;
    previewImageUrl?: string | null;
  }>;
  portfolioItems?: Array<{
    applicationId?: string;
    listingTitle?: string;
    imageUrl?: string;
    approvedAt?: string;
  }>;
};

export type PublicUserProfile = {
  profileId: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  bio?: string;
  cvUrl?: string;
  completedTaskCount: number;
  averageRating: number;
  feedbackCount: number;
  approvedComplaintCount: number;
  complaintRate: number;
  isDangerous: boolean;
  completedTasks: CompletedTask[];
  portfolio: PortfolioItem[];
};

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapCompletedTasks(
  dto: PublicProfileDto,
  portfolio: PortfolioItem[]
): CompletedTask[] {
  if (dto.completedTasks?.length) {
    return dto.completedTasks.map((task) => ({
      applicationId: String(task.applicationId ?? ''),
      taskTitle: task.listingTitle?.trim() || 'Görev',
      completedAt: toTimestamp(task.completedAt),
      imageCount: task.imageCount ?? 0,
      previewImageUrl: task.previewImageUrl?.trim()
        ? resolveMediaUrl(task.previewImageUrl.trim())
        : null,
    }));
  }

  const grouped = new Map<string, CompletedTask>();
  for (const item of portfolio) {
    const existing = grouped.get(item.applicationId);
    if (existing) {
      existing.imageCount += 1;
    } else {
      grouped.set(item.applicationId, {
        applicationId: item.applicationId,
        taskTitle: item.taskTitle,
        completedAt: item.approvedAt,
        imageCount: 1,
        previewImageUrl: item.imageUrl,
      });
    }
  }
  return Array.from(grouped.values());
}

function mapPublicProfile(dto: PublicProfileDto): PublicUserProfile {
  const profileId = String(dto.profileId ?? '');
  const portfolio = (dto.portfolioItems ?? []).map((item, index) => ({
    id: `${item.applicationId ?? 'app'}-${index}`,
    imageUrl: resolveMediaUrl(String(item.imageUrl ?? '')),
    taskTitle: item.listingTitle?.trim() || 'Görev',
    applicationId: String(item.applicationId ?? ''),
    approvedAt: toTimestamp(item.approvedAt),
  }));
  const completedTasks = mapCompletedTasks(dto, portfolio);

  return {
    profileId,
    userId: String(dto.userId ?? ''),
    username: dto.username?.trim() || '',
    fullName: dto.fullName?.trim() || 'Kullanıcı',
    avatarUrl: dto.avatarUrl?.trim() ? resolveMediaUrl(dto.avatarUrl.trim()) : null,
    bio: dto.bio?.trim() || undefined,
    cvUrl: dto.cvUrl?.trim() ? resolveMediaUrl(dto.cvUrl.trim()) : undefined,
    completedTaskCount: dto.completedTaskCount ?? completedTasks.length,
    averageRating: dto.averageRating ?? 0,
    feedbackCount: dto.feedbackCount ?? 0,
    approvedComplaintCount: dto.approvedComplaintCount ?? 0,
    complaintRate: dto.complaintRate ?? 0,
    isDangerous: dto.isDangerous ?? false,
    completedTasks,
    portfolio,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** profileId ile herkese açık profil */
export async function fetchPublicProfileByProfileId(
  profileId: string
): Promise<PublicUserProfile | null> {
  if (!isBackendId(profileId)) return null;
  try {
    const { data } = await apiClient.get<PublicProfileDto>(
      `/api/individual/profiles/${profileId}/public`
    );
    return mapPublicProfile(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'Profil yüklenemedi.');
  }
}

/** Kullanıcı adı ile herkese açık profil */
export async function fetchPublicProfileByUsername(
  username: string
): Promise<PublicUserProfile | null> {
  const normalized = username.trim().toLowerCase().replace(/^@/, '');
  if (!normalized || normalized.length < 3) return null;

  try {
    const { data } = await apiClient.get<PublicProfileDto>(
      `/api/individual/profiles/by-username/${encodeURIComponent(normalized)}/public`
    );
    return mapPublicProfile(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'Profil yüklenemedi.');
  }
}

/** userId ile herkese açık profil */
export async function fetchPublicProfileByUserId(
  userId: string
): Promise<PublicUserProfile | null> {
  if (!isBackendId(userId)) return null;
  try {
    const { data } = await apiClient.get<PublicProfileDto>(
      `/api/users/${userId}/public-profile`
    );
    return mapPublicProfile(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'Profil yüklenemedi.');
  }
}

/**
 * id hem userId hem profileId olabilir.
 * Önce profileId dener; bulunamazsa userId endpoint'ine düşer.
 */
export async function fetchPublicProfile(id: string): Promise<PublicUserProfile | null> {
  if (!(await hasRestAuthSession()) || !isBackendId(id)) return null;

  const byProfile = await fetchPublicProfileByProfileId(id);
  if (byProfile) return byProfile;

  return fetchPublicProfileByUserId(id);
}

/** Oturum açmış kullanıcının kendi public profilini döndürür */
export async function fetchMyPublicProfile(): Promise<PublicUserProfile | null> {
  const claims = await getSessionClaims();
  const profileId = claims?.profileId;
  if (!profileId) return null;
  return fetchPublicProfileByProfileId(profileId);
}
