import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import type { TradeOfferStatus } from './types';

export type SwapOfferMessage = {
  id: string;
  swapOfferId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type SwapOfferChatContext = {
  offerId: string;
  listingId: string;
  listingTitle: string;
  peerName: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  initialMessage?: string | null;
};

type SwapOfferMessageDto = {
  id: string;
  swapOfferId: string;
  senderId: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

type SwapOfferChatContextDto = {
  offerId: string;
  listingId: string;
  listingTitle: string;
  peerName: string;
  status: string;
  initialMessage?: string | null;
};

function mapMessage(dto: SwapOfferMessageDto): SwapOfferMessage {
  return {
    id: dto.id,
    swapOfferId: dto.swapOfferId,
    senderId: dto.senderId,
    body: dto.body,
    createdAt: dto.createdAt,
    mine: dto.mine,
  };
}

function mapStatus(raw: string): TradeOfferStatus {
  switch (raw?.toUpperCase()) {
    case 'ACCEPTED':
      return 'accepted';
    case 'REJECTED':
      return 'rejected';
    default:
      return 'pending';
  }
}

export function normalizeSwapOfferId(raw: string | string[] | undefined): string | null {
  if (Array.isArray(raw)) return raw[0]?.trim() || null;
  return raw?.trim() || null;
}

export async function fetchSwapOfferChatContext(offerId: string): Promise<SwapOfferChatContext> {
  const { data } = await apiClient.get<SwapOfferChatContextDto>(
    `/api/swap-offers/${offerId}/chat-context`
  );
  return {
    offerId: String(data.offerId),
    listingId: String(data.listingId),
    listingTitle: data.listingTitle,
    peerName: data.peerName,
    status: (data.status?.toUpperCase() as SwapOfferChatContext['status']) ?? 'PENDING',
    initialMessage: data.initialMessage,
  };
}

export async function fetchSwapOfferMessages(offerId: string): Promise<SwapOfferMessage[]> {
  const { data } = await apiClient.get<SwapOfferMessageDto[]>(
    `/api/swap-offers/${offerId}/messages`
  );
  return Array.isArray(data) ? data.map(mapMessage) : [];
}

export async function sendSwapOfferMessage(
  offerId: string,
  body: string
): Promise<SwapOfferMessage> {
  try {
    const { data } = await apiClient.post<SwapOfferMessageDto>(
      `/api/swap-offers/${offerId}/messages`,
      { body }
    );
    return mapMessage(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(getApiErrorMessage(error, 'Mesaj gönderilemedi.'));
    }
    throw error;
  }
}

export { mapStatus as mapSwapOfferStatus };
