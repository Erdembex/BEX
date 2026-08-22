import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { BexNotification } from '@/types';
import { mapBackendNotificationType } from './notificationTypes';

type NotificationDto = {
  id?: string;
  type?: string;
  referenceId?: string | null;
  referenceType?: string | null;
  title?: string;
  body?: string;
  isRead?: boolean;
  createdAt?: string;
};

type NotificationsPageDto = {
  content?: NotificationDto[];
  nextCursor?: string | null;
};

function toTimestamp(value?: string | null): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapNotification(dto: NotificationDto, userId: string): BexNotification {
  const typeKey = dto.type?.toUpperCase() ?? '';
  const data: Record<string, string> = {};
  if (dto.referenceId) {
    const refType = dto.referenceType?.toUpperCase() ?? '';
    if (refType.includes('APPLICATION')) {
      data.applicationId = String(dto.referenceId);
    } else if (refType.includes('CONVERSATION')) {
      data.conversationId = String(dto.referenceId);
    } else if (refType.includes('BUSINESS')) {
      data.businessId = String(dto.referenceId);
    } else if (refType.includes('LISTING')) {
      data.taskId = String(dto.referenceId);
    } else if (refType.includes('COUPON')) {
      data.couponId = String(dto.referenceId);
    } else if (refType.includes('SWAP')) {
      data.offerId = String(dto.referenceId);
      data.referenceId = String(dto.referenceId);
    } else {
      data.referenceId = String(dto.referenceId);
    }
  }

  return {
    id: String(dto.id),
    userId,
    title: dto.title?.trim() || 'Bildirim',
    body: dto.body?.trim() || '',
    type: mapBackendNotificationType(typeKey),
    data,
    read: dto.isRead ?? false,
    createdAt: toTimestamp(dto.createdAt),
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error) return error;
  return new Error(fallback);
}

export async function fetchNotifications(
  userId: string,
  pageSize = 50
): Promise<BexNotification[]> {
  try {
    const { data, headers } = await apiClient.get<NotificationsPageDto>('/api/notifications', {
      params: { pageSize },
    });
    const rows = Array.isArray(data?.content) ? data.content : [];
    return rows.map((row) => mapNotification(row, userId));
  } catch (error) {
    throw mapError(error, 'Bildirimler yüklenemedi.');
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<{ count?: number }>('/api/notifications/unread-count');
    return typeof data?.count === 'number' ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/api/notifications/read-all');
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.patch(`/api/notifications/${notificationId}/read`);
}

export async function markNotificationReadByReference(referenceId: string): Promise<void> {
  await apiClient.patch(`/api/notifications/read-by-reference/${referenceId}`);
}

export async function markConversationNotificationsRead(conversationId: string): Promise<void> {
  try {
    await markNotificationReadByReference(conversationId);
  } catch {
    // sessiz — mesaj rozeti ana düzeltme
  }
}
