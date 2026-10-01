import { Timestamp } from 'firebase/firestore';
import { applicationsRepository, businessesRepository, tasksRepository, usersRepository } from '@/features/data';
import { canUseApplicationMessages } from '@/features/messages';
import { fetchInbox, fetchMessagesByApplication, usesConversationsRest } from './conversationsApi';
import { messagesRepository } from './index';
import { ApplicationStatus, Application } from '@/types';

export type ConversationPreview = {
  applicationId: string;
  conversationId?: string;
  peerName: string;
  peerAvatarUrl?: string | null;
  taskTitle: string;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
  unreadCount: number;
  status: ApplicationStatus;
};

type PeerInfo = {
  name: string;
  avatarUrl?: string | null;
};

async function buildPreviews(
  eligible: Application[],
  resolvePeer: (app: Application) => Promise<PeerInfo>
): Promise<ConversationPreview[]> {
  const unreadMap = new Map<string, number>();
  const conversationIdMap = new Map<string, string>();

  if (await usesConversationsRest()) {
    try {
      const inbox = await fetchInbox();
      for (const row of inbox) {
        unreadMap.set(row.applicationId, row.unreadCount);
        conversationIdMap.set(row.applicationId, row.conversationId);
      }
    } catch {
      // Inbox API başarısız — başvuru listesinden devam et
    }
  }

  const previews = await Promise.all(
    eligible.map(async (app) => {
      const [peer, task, messages] = await Promise.all([
        resolvePeer(app),
        tasksRepository.getById(app.taskId),
        messagesRepository.getByApplication(app.id).catch(() => []),
      ]);
      const last = messages[messages.length - 1];

      return {
        applicationId: app.id,
        conversationId: conversationIdMap.get(app.id),
        peerName: peer.name,
        peerAvatarUrl: peer.avatarUrl ?? null,
        taskTitle: task?.title ?? 'Görev',
        lastMessage: last?.text,
        lastMessageAt: last?.createdAt,
        unreadCount: unreadMap.get(app.id) ?? 0,
        status: app.status,
      } satisfies ConversationPreview;
    })
  );

  previews.sort((a, b) => {
    const aTime = a.lastMessageAt?.toMillis() ?? 0;
    const bTime = b.lastMessageAt?.toMillis() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.peerName.localeCompare(b.peerName, 'tr');
  });

  return previews;
}

async function loadDirectPreviews(audience: 'user' | 'business'): Promise<ConversationPreview[]> {
  if (!(await usesConversationsRest())) return [];
  let inbox: Awaited<ReturnType<typeof fetchInbox>> = [];
  try {
    inbox = await fetchInbox();
  } catch {
    return [];
  }

  const directs = inbox.filter((row) => row.direct);
  const previews = await Promise.all(
    directs.map(async (row) => {
      const peerId = audience === 'business' ? row.individualUserId : row.businessUserId;
      const messages = await fetchMessagesByApplication(row.applicationId).catch(() => []);
      const last = messages[messages.length - 1];
      let peerName = audience === 'business' ? 'Kullanıcı' : 'İşletme';
      let peerAvatarUrl: string | null = null;
      if (audience === 'business' && peerId) {
        const stats = await usersRepository.getPublicProfileStats(peerId).catch(() => null);
        peerName =
          stats?.displayName?.replace(/^@/, '') ||
          (await usersRepository.getDisplayName(peerId).catch(() => peerName));
        peerAvatarUrl = stats?.avatarUrl ?? null;
      } else if (peerId) {
        peerName = await usersRepository.getDisplayName(peerId).catch(() => peerName);
      }

      return {
        applicationId: row.applicationId,
        conversationId: row.conversationId,
        peerName,
        peerAvatarUrl,
        taskTitle: 'Özel ilan',
        lastMessage: last?.text,
        lastMessageAt: last?.createdAt ?? row.createdAt,
        unreadCount: row.unreadCount,
        status: 'approved' as const,
      } satisfies ConversationPreview;
    })
  );
  return previews;
}

function mergePreviews(base: ConversationPreview[], extra: ConversationPreview[]): ConversationPreview[] {
  const seen = new Set(base.map((row) => row.conversationId).filter(Boolean));
  const merged = [...base];
  for (const row of extra) {
    if (row.conversationId && seen.has(row.conversationId)) continue;
    merged.push(row);
  }
  merged.sort((a, b) => {
    const aTime = a.lastMessageAt?.toMillis() ?? 0;
    const bTime = b.lastMessageAt?.toMillis() ?? 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.peerName.localeCompare(b.peerName, 'tr');
  });
  return merged;
}

export async function loadMessagingInbox(userId: string): Promise<{
  conversations: ConversationPreview[];
  isUnlocked: boolean;
  totalUnread: number;
}> {
  const apps = await applicationsRepository.getByUser(userId);
  const eligible = apps.filter((app) => canUseApplicationMessages(app.status));
  const directs = await loadDirectPreviews('user');
  const isUnlocked = eligible.length > 0 || directs.length > 0;

  if (!isUnlocked) {
    return { conversations: [], isUnlocked: false, totalUnread: 0 };
  }

  const fromApps = eligible.length
    ? await buildPreviews(eligible, async (app) => {
        const business = await businessesRepository.getById(app.businessId);
        return {
          name: business?.name ?? 'İşletme',
          avatarUrl: business?.logoUrl?.trim() || null,
        };
      })
    : [];
  const conversations = mergePreviews(fromApps, directs);

  const totalUnread = conversations.reduce((sum, row) => sum + row.unreadCount, 0);
  return { conversations, isUnlocked: true, totalUnread };
}

export async function loadBusinessMessagingInbox(businessId: string): Promise<{
  conversations: ConversationPreview[];
  isUnlocked: boolean;
  totalUnread: number;
}> {
  const apps = await applicationsRepository.getByBusiness(businessId);
  const eligible = apps.filter((app) => canUseApplicationMessages(app.status));
  const directs = await loadDirectPreviews('business');
  const isUnlocked = eligible.length > 0 || directs.length > 0;

  if (!isUnlocked) {
    return { conversations: [], isUnlocked: false, totalUnread: 0 };
  }

  const fromApps = eligible.length
    ? await buildPreviews(eligible, async (app) => {
        const stats = await usersRepository.getPublicProfileStats(app.userId);
        const name =
          app.applicantName?.trim() ||
          stats?.displayName?.replace(/^@/, '') ||
          (await usersRepository.getDisplayName(app.userId));
        return {
          name,
          avatarUrl: app.applicantAvatarUrl ?? stats?.avatarUrl ?? null,
        };
      })
    : [];
  const conversations = mergePreviews(fromApps, directs);

  const totalUnread = conversations.reduce((sum, row) => sum + row.unreadCount, 0);
  return { conversations, isUnlocked: true, totalUnread };
}
