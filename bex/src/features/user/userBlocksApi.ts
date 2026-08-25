import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api/axiosInstance';
import { isBackendId } from '@/lib/api/backendId';

export type BlockedUserDto = {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
  userType: 'INDIVIDUAL' | 'BUSINESS' | string;
  blockedAt?: string;
};

function mapBlockError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error));
  }
  if (error instanceof Error) return error;
  return new Error('İşlem tamamlanamadı.');
}

function assertBlockUserId(userId: string): void {
  if (!isBackendId(userId)) {
    throw new Error('Geçersiz kullanıcı kimliği.');
  }
}

export async function blockUserRequest(userId: string): Promise<void> {
  assertBlockUserId(userId);
  try {
    await apiClient.post(`/api/users/${userId}/block`);
  } catch (error) {
    throw mapBlockError(error);
  }
}

export async function unblockUserRequest(userId: string): Promise<void> {
  assertBlockUserId(userId);
  try {
    await apiClient.delete(`/api/users/${userId}/block`);
  } catch (error) {
    throw mapBlockError(error);
  }
}

export async function fetchBlockedUsersRequest(): Promise<BlockedUserDto[]> {
  try {
    const { data } = await apiClient.get<{ items?: BlockedUserDto[] }>('/api/users/blocks');
    return data.items ?? [];
  } catch (error) {
    throw mapBlockError(error);
  }
}
