import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';

export type FeedbackDto = {
  id: string;
  applicationId: string;
  targetProfileId: string;
  authorRole: 'INDIVIDUAL' | 'BUSINESS';
  stars: number;
  comment?: string | null;
  authorDisplayName: string;
  createdAt?: string;
};

export type ProfileFeedbackSummaryDto = {
  averageStars: number;
  totalCount: number;
  recent: FeedbackDto[];
};

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export async function fetchProfileFeedback(
  profileId: string,
  limit = 10
): Promise<ProfileFeedbackSummaryDto> {
  const { data } = await apiClient.get<ProfileFeedbackSummaryDto>(
    `/api/profiles/${profileId}/feedback`,
    { params: { limit } }
  );
  return {
    averageStars: data.averageStars ?? 0,
    totalCount: data.totalCount ?? 0,
    recent: data.recent ?? [],
  };
}

export async function submitIndividualFeedback(
  applicationId: string,
  stars: number,
  comment?: string
): Promise<FeedbackDto> {
  try {
    const { data } = await apiClient.post<FeedbackDto>(
      `/api/individual/applications/${applicationId}/feedback`,
      { stars, comment: comment?.trim() || null }
    );
    return data;
  } catch (error) {
    throw mapError(error, 'Geri bildirim gönderilemedi.');
  }
}

export async function submitBusinessFeedback(
  applicationId: string,
  stars: number,
  comment?: string
): Promise<FeedbackDto> {
  try {
    const { data } = await apiClient.post<FeedbackDto>(
      `/api/business/applications/${applicationId}/feedback`,
      { stars, comment: comment?.trim() || null }
    );
    return data;
  } catch (error) {
    throw mapError(error, 'Geri bildirim gönderilemedi.');
  }
}

export type PendingFeedbackDto = {
  applicationId: string;
  listingId: string;
  taskTitle: string;
  status: string;
};

function isRewardedFeedbackStatus(status: string | undefined): boolean {
  return (status ?? '').toUpperCase() === 'REWARDED';
}

export async function fetchPendingFeedback(
  role: 'user' | 'business'
): Promise<PendingFeedbackDto[]> {
  const path =
    role === 'business'
      ? '/api/business/applications/pending-feedback'
      : '/api/individual/applications/pending-feedback';
  try {
    const { data } = await apiClient.get<PendingFeedbackDto[]>(path);
    const items = Array.isArray(data) ? data : [];
    return items.filter((item) => isRewardedFeedbackStatus(item.status));
  } catch (error) {
    throw mapError(error, 'Bekleyen puanlar yüklenemedi.');
  }
}
