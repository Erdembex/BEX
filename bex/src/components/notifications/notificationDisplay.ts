import { BexNotification, NotificationType } from '@/types';

export type NotificationVisual = {
  icon: string;
  tint: string;
};

const VISUALS: Record<NotificationType, NotificationVisual> = {
  application_approved: { icon: '✓', tint: '#166534' },
  application_rejected: { icon: '✕', tint: '#991B1B' },
  coupon_issued: { icon: '🎟', tint: '#7C3AED' },
  message: { icon: '💬', tint: '#FACC15' },
  trade_offer_received: { icon: '↔', tint: '#B45309' },
  trade_offer_accepted: { icon: '✓', tint: '#166534' },
  trade_offer_rejected: { icon: '↩', tint: '#6B7280' },
  trade_offer_message: { icon: '💬', tint: '#B45309' },
  task_approved: { icon: '📋', tint: '#0F766E' },
  kyc_result: { icon: '🛡', tint: '#4338CA' },
  general: { icon: '🔔', tint: '#374151' },
};

export function getNotificationVisual(type: NotificationType): NotificationVisual {
  return VISUALS[type] ?? VISUALS.general;
}

export type NotificationSection = {
  key: string;
  title: string;
  data: BexNotification[];
};

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function groupNotificationsByDay(items: BexNotification[]): NotificationSection[] {
  const todayStart = startOfDay(new Date());
  const yesterdayStart = todayStart - 86400000;

  const today: BexNotification[] = [];
  const yesterday: BexNotification[] = [];
  const earlier: BexNotification[] = [];

  for (const item of items) {
    const dayStart = startOfDay(item.createdAt.toDate());
    if (dayStart >= todayStart) today.push(item);
    else if (dayStart >= yesterdayStart) yesterday.push(item);
    else earlier.push(item);
  }

  const sections: NotificationSection[] = [];
  if (today.length) sections.push({ key: 'today', title: 'Bugün', data: today });
  if (yesterday.length) sections.push({ key: 'yesterday', title: 'Dün', data: yesterday });
  if (earlier.length) sections.push({ key: 'earlier', title: 'Önceki', data: earlier });
  return sections;
}
