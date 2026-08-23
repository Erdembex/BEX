import { notifyUser } from '@/features/notifications/notificationsRepository';
import { t } from '@/i18n';

type TradeNotifyData = {
  listingId: string;
  offerId: string;
  tradeTab: 'new' | 'offers';
};

export async function notifyTradeOfferReceived(params: {
  ownerId: string;
  fromUserName: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'new',
  };

  await notifyUser({
    userId: params.ownerId,
    title: t('tradeNotifications.offerReceivedTitle'),
    body: t('tradeNotifications.offerReceivedBody', { name: params.fromUserName, title: params.listingTitle }),
    type: 'trade_offer_received',
    data,
    showLocalForUserId: params.ownerId,
  });
}

export async function notifyTradeOfferAccepted(params: {
  fromUserId: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'offers',
  };

  await notifyUser({
    userId: params.fromUserId,
    title: t('tradeNotifications.offerAcceptedTitle'),
    body: t('tradeNotifications.offerAcceptedBody', { title: params.listingTitle }),
    type: 'trade_offer_accepted',
    data,
    showLocalForUserId: params.fromUserId,
  });
}

export async function notifyTradeOfferRejected(params: {
  fromUserId: string;
  listingTitle: string;
  listingId: string;
  offerId: string;
  reason?: 'declined' | 'other_accepted';
}): Promise<void> {
  const data: TradeNotifyData = {
    listingId: params.listingId,
    offerId: params.offerId,
    tradeTab: 'offers',
  };

  const body =
    params.reason === 'other_accepted'
      ? t('tradeNotifications.offerRejectedOtherAccepted', { title: params.listingTitle })
      : t('tradeNotifications.offerRejectedDeclined', { title: params.listingTitle });

  await notifyUser({
    userId: params.fromUserId,
    title: t('tradeNotifications.offerUpdatedTitle'),
    body,
    type: 'trade_offer_rejected',
    data,
    showLocalForUserId: params.fromUserId,
  });
}
