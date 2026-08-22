import { router, Href } from 'expo-router';
import type { TradeOffer, TradeOfferStatus } from './types';

export function swapChatHref(
  offerId: string,
  params?: {
    listingTitle?: string;
    peerName?: string;
    status?: TradeOfferStatus;
  }
): Href {
  return `/swap-chat/${offerId}` as Href;
}

export function openSwapOfferChat(
  offer: Pick<TradeOffer, 'id' | 'listingTitle' | 'fromUserName' | 'status'>,
  peerName?: string
): void {
  router.push(swapChatHref(offer.id));
}

export function leaveSwapOfferChat(): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace('/(tabs)/trade' as Href);
}
