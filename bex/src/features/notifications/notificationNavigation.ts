import { Href, router } from 'expo-router';
import { resolveApplicationIdByConversation } from '@/features/messages/conversationsApi';
import { BexNotification, UserRole } from '@/types';

export function getNotificationsListHref(role?: UserRole): Href {
  if (role === 'business') return '/(business)/notifications' as Href;
  if (role === 'admin') return '/(admin)/notifications' as Href;
  return '/(tabs)/notifications' as Href;
}

/** Tabs drawer içindeki bildirimler ekranı (navigate adı) */
export const TABS_NOTIFICATIONS_DRAWER_ROUTE = 'notifications/index';

function messagesInboxHref(role?: UserRole): Href {
  return role === 'business'
    ? ('/(business)/messages' as Href)
    : ('/(tabs)/messages' as Href);
}

function messageThreadHref(applicationId: string, role?: UserRole): Href {
  if (role === 'business') {
    return `/(business)/messages/${applicationId}` as Href;
  }
  return `/(tabs)/messages/${applicationId}` as Href;
}

function swapChatHref(offerId: string): Href {
  return `/swap-chat/${offerId}` as Href;
}

function tradeTabHref(tab: 'new' | 'offers'): Href {
  return { pathname: '/(tabs)/trade', params: { tab } } as Href;
}

export function getNotificationTarget(
  item: BexNotification,
  role?: UserRole
): Href | null {
  if (item.data?.taskId && role === 'admin' && !item.data?.applicationId) {
    return '/(admin)/tasks' as Href;
  }

  if (item.data?.businessId && role === 'admin' && !item.data?.applicationId) {
    return '/(admin)/verifications' as Href;
  }

  const applicationId = item.data?.applicationId;

  if (item.type === 'message') {
    if (applicationId) {
      return messageThreadHref(applicationId, role);
    }
    return messagesInboxHref(role);
  }

  if (applicationId) {
    if (role === 'admin') {
      return '/(admin)/submissions' as Href;
    }
    if (role === 'business') {
      return `/(business)/applications/${applicationId}` as Href;
    }
    if (item.type === 'application_approved') {
      return `/task/submit/${applicationId}` as Href;
    }
    return `/application/${applicationId}` as Href;
  }

  switch (item.type) {
    case 'coupon_issued':
      return '/(tabs)/wallet' as Href;
    case 'task_approved':
      return role === 'business' ? ('/(business)/tasks' as Href) : null;
    case 'kyc_result':
      return role === 'business' ? ('/(business)/verification' as Href) : null;
    case 'trade_offer_received':
    case 'trade_offer_message':
      if (item.data?.offerId) {
        return swapChatHref(item.data.offerId);
      }
      return tradeTabHref('new');
    case 'trade_offer_accepted':
    case 'trade_offer_rejected':
      if (item.data?.offerId) {
        return `/swap-chat/${item.data.offerId}` as Href;
      }
      return tradeTabHref('offers');
    default:
      return null;
  }
}

/** Mesaj bildirimlerinde conversationId → applicationId çözümlemesi */
export async function resolveNotificationTarget(
  item: BexNotification,
  role?: UserRole
): Promise<Href | null> {
  if (item.type === 'message' && !item.data?.applicationId) {
    const conversationId = item.data?.conversationId ?? item.data?.referenceId;
    if (conversationId) {
      const applicationId = await resolveApplicationIdByConversation(conversationId);
      if (applicationId) {
        return messageThreadHref(applicationId, role);
      }
    }
    return messagesInboxHref(role);
  }

  return getNotificationTarget(item, role);
}

/** Güvenli bildirim navigasyonu — geçersiz rota yerine liste ekranına düşer */
export async function openNotificationTarget(
  item: BexNotification,
  role?: UserRole
): Promise<void> {
  const target = await resolveNotificationTarget(item, role);
  if (target) {
    router.push(target);
    return;
  }
  router.push(getNotificationsListHref(role));
}

export async function openNotificationsList(role?: UserRole): Promise<void> {
  router.push(getNotificationsListHref(role));
}
