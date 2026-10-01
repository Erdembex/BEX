import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { getSessionClaims, hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { ApplicationMessage, UserRole } from '@/types';
import { formatOfferLabel, mapOfferDto } from './offersApi';

type ConversationDto = {
  id: string;
  applicationId?: string;
  businessUserId?: string;
  individualUserId?: string;
  status?: string;
  unreadCount?: number;
  createdAt?: string;
};

export const DIRECT_THREAD_PREFIX = 'direct-';

export function directThreadKey(conversationId: string): string {
  return `${DIRECT_THREAD_PREFIX}${conversationId}`;
}

export function parseDirectThreadKey(routeKey: string): string | null {
  return routeKey.startsWith(DIRECT_THREAD_PREFIX)
    ? routeKey.slice(DIRECT_THREAD_PREFIX.length)
    : null;
}

export type InboxConversation = {
  conversationId: string;
  /** Başvuru sohbeti: applicationId. Doğrudan ilan sohbeti: direct-{conversationId} */
  applicationId: string;
  direct: boolean;
  businessUserId: string;
  individualUserId: string;
  unreadCount: number;
  createdAt: Timestamp;
};

type MessageDto = {
  id: string;
  conversationId?: string;
  senderId?: string;
  messageType?: string;
  content?: string;
  mediaUrl?: string | null;
  createdAt?: string;
  isRead?: boolean;
  offer?: {
    id?: string;
    messageId?: string;
    listingId?: string;
    listingTitle?: string | null;
    listingDescription?: string | null;
    resultApplicationId?: string | null;
    rewardType?: string;
    quantity?: number;
    unit?: string;
    validityDays?: number;
    note?: string | null;
    status?: string;
  };
};

type MessagesPageDto = {
  content?: MessageDto[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

const conversationCache = new Map<string, string>();

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapMessage(
  dto: MessageDto,
  applicationId: string,
  currentUserId?: string,
  currentUserType?: string
): ApplicationMessage {
  const senderId = String(dto.senderId ?? '');
  const isMine = !!currentUserId && senderId === currentUserId;
  let senderRole: UserRole = 'user';
  if (isMine) {
    senderRole = currentUserType === 'BUSINESS' ? 'business' : 'user';
  } else {
    senderRole = currentUserType === 'BUSINESS' ? 'user' : 'business';
  }

  const isOffer = dto.messageType?.toUpperCase() === 'OFFER';
  const isImage = dto.messageType?.toUpperCase() === 'IMAGE';
  const isSystem = dto.messageType?.toUpperCase() === 'SYSTEM';
  const offer = isOffer && dto.offer ? mapOfferDto(dto.offer) : undefined;
  const offerPreview = offer ? formatOfferLabel(offer) : '';
  const caption = dto.content?.trim() ?? '';
  const mediaUrl = dto.mediaUrl?.trim() || undefined;

  let messageType: ApplicationMessage['messageType'] = 'text';
  let text = caption;
  if (isOffer) {
    messageType = 'offer';
    text = offerPreview;
  } else if (isImage) {
    messageType = 'image';
    text = caption || '📷 Fotoğraf';
  } else if (isSystem) {
    messageType = 'system';
    text = caption;
  }

  return {
    id: String(dto.id),
    applicationId,
    senderId,
    senderRole,
    text,
    createdAt: toTimestamp(dto.createdAt),
    isRead: dto.isRead ?? false,
    messageType,
    offer,
    mediaUrl,
  };
}

function mapMessagesError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403 || status === 404) {
      return new Error('Bu başvuru için mesajlaşma açılamadı. Sayfayı yenileyip tekrar deneyin.');
    }
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export async function usesConversationsRest(): Promise<boolean> {
  return hasRestAuthSession();
}

/** Gelen kutusu — GET /api/conversations */
export async function fetchInbox(): Promise<InboxConversation[]> {
  try {
    const { data } = await apiClient.get<ConversationDto[]>('/api/conversations');
    return (Array.isArray(data) ? data : [])
      .filter((row) => row.id)
      .map((row) => {
        const conversationId = String(row.id);
        const applicationId = row.applicationId
          ? String(row.applicationId)
          : directThreadKey(conversationId);
        return {
          conversationId,
          applicationId,
          direct: !row.applicationId,
          businessUserId: String(row.businessUserId ?? ''),
          individualUserId: String(row.individualUserId ?? ''),
          unreadCount: row.unreadCount ?? 0,
          createdAt: toTimestamp(row.createdAt),
        };
      });
  } catch (error) {
    throw mapMessagesError(error, 'Sohbetler yüklenemedi.');
  }
}

export async function resolveApplicationIdByConversation(conversationId: string): Promise<string | null> {
  try {
    const { data } = await apiClient.get<ConversationDto>(`/api/conversations/${conversationId}`);
    return data.applicationId ? String(data.applicationId) : null;
  } catch {
    return null;
  }
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await apiClient.patch(`/api/conversations/${conversationId}/read`);
}

/** Mesajları yüklerken okundu işaretle — PATCH başarısız olsa bile GET sonrası backend temizler */
export async function markConversationReadByApplication(
  applicationId: string,
  priorUnread = 0
): Promise<{ ok: boolean; conversationId: string | null; unreadCleared: number }> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) {
    return { ok: false, conversationId: null, unreadCleared: 0 };
  }
  try {
    await markConversationRead(conversationId);
    return { ok: true, conversationId, unreadCleared: priorUnread };
  } catch {
    return { ok: false, conversationId, unreadCleared: 0 };
  }
}

export async function fetchConversationParticipants(
  applicationId: string
): Promise<{ businessUserId: string; individualUserId: string } | null> {
  try {
    const { data } = await apiClient.get<ConversationDto>(
      `/api/conversations/by-application/${applicationId}`
    );
    const businessUserId = String(data.businessUserId ?? '');
    const individualUserId = String(data.individualUserId ?? '');
    if (!businessUserId || !individualUserId) return null;
    return { businessUserId, individualUserId };
  } catch {
    return null;
  }
}

export async function openDirectConversation(individualUserId: string): Promise<string> {
  try {
    const { data } = await apiClient.post<ConversationDto>('/api/conversations/direct', {
      individualUserId,
    });
    const conversationId = String(data.id);
    conversationCache.set(directThreadKey(conversationId), conversationId);
    return conversationId;
  } catch (error) {
    throw mapMessagesError(error, 'Sohbet açılamadı.');
  }
}

export async function resolveConversationId(applicationId: string): Promise<string | null> {
  const directId = parseDirectThreadKey(applicationId);
  if (directId) {
    conversationCache.set(applicationId, directId);
    return directId;
  }

  const cached = conversationCache.get(applicationId);
  if (cached) return cached;

  try {
    const { data } = await apiClient.get<ConversationDto>(
      `/api/conversations/by-application/${applicationId}`
    );
    const conversationId = String(data.id);
    conversationCache.set(applicationId, conversationId);
    return conversationId;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404)) {
      return null;
    }
    throw mapMessagesError(error, 'Konuşma yüklenemedi.');
  }
}

export async function fetchMessagesByApplication(
  applicationId: string
): Promise<ApplicationMessage[]> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) return [];

  const claims = await getSessionClaims();
  const currentUserId = claims?.sub ?? undefined;
  const currentUserType = claims?.userType;

  try {
    const { data } = await apiClient.get<MessagesPageDto | MessageDto[]>(
      `/api/conversations/${conversationId}/messages`,
      { params: { pageSize: 50 } }
    );

    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : [];

    return rows
      .map((row) => mapMessage(row, applicationId, currentUserId, currentUserType))
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  } catch (error) {
    throw mapMessagesError(error, 'Mesajlar yüklenemedi.');
  }
}

export async function sendMessageByApplication(
  applicationId: string,
  text: string
): Promise<ApplicationMessage> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) {
    throw new Error('Bu başvuru için mesajlaşma açılamadı. Sayfayı yenileyip tekrar deneyin.');
  }

  try {
    const claims = await getSessionClaims();
    const { data } = await apiClient.post<MessageDto>(
      `/api/conversations/${conversationId}/messages`,
      { content: text.trim() }
    );
    return mapMessage(data, applicationId, claims?.sub, claims?.userType);
  } catch (error) {
    throw mapMessagesError(error, 'Mesaj gönderilemedi.');
  }
}

export async function sendImageMessageByApplication(
  applicationId: string,
  mediaUrl: string,
  caption?: string
): Promise<ApplicationMessage> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) {
    throw new Error('Bu başvuru için mesajlaşma açılamadı. Sayfayı yenileyip tekrar deneyin.');
  }

  try {
    const claims = await getSessionClaims();
    const { data } = await apiClient.post<MessageDto>(
      `/api/conversations/${conversationId}/messages`,
      {
        mediaUrl: mediaUrl.trim(),
        content: caption?.trim() || null,
      }
    );
    return mapMessage(data, applicationId, claims?.sub, claims?.userType);
  } catch (error) {
    throw mapMessagesError(error, 'Görsel gönderilemedi.');
  }
}

export function clearConversationCache(applicationId?: string): void {
  if (applicationId) {
    conversationCache.delete(applicationId);
    return;
  }
  conversationCache.clear();
}
