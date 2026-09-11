import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from "expo-router/react-navigation";
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import {
  ConversationPreview,
  loadBusinessMessagingInbox,
  loadMessagingInbox,
} from '@/features/messages/inboxService';
import { useMessagingInboxStore } from '@/store/messagingInboxStore';

export type MessagingAudience = 'user' | 'business';

export function useMessagingInbox(audience: MessagingAudience = 'user') {
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const refreshToken = useMessagingInboxStore((s) => s.refreshToken);
  const setUserTotalUnread = useMessagingInboxStore((s) => s.setUserTotalUnread);
  const setBusinessTotalUnread = useMessagingInboxStore((s) => s.setBusinessTotalUnread);
  const beginUserFetch = useMessagingInboxStore((s) => s.beginUserFetch);
  const beginBusinessFetch = useMessagingInboxStore((s) => s.beginBusinessFetch);
  const isUserFetchCurrent = useMessagingInboxStore((s) => s.isUserFetchCurrent);
  const isBusinessFetchCurrent = useMessagingInboxStore((s) => s.isBusinessFetchCurrent);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const totalUnread = useMessagingInboxStore((s) =>
    audience === 'business' ? s.businessTotalUnread : s.userTotalUnread
  );

  const refresh = useCallback(async () => {
    if (audience === 'business') {
      if (!business?.id) {
        setConversations([]);
        setIsUnlocked(false);
        setBusinessTotalUnread(0);
        setLoading(false);
        return;
      }

      const fetchGen = beginBusinessFetch();
      setLoading(true);
      try {
        const result = await loadBusinessMessagingInbox(business.id);
        if (!isBusinessFetchCurrent(fetchGen)) return;
        setConversations(result.conversations);
        setIsUnlocked(result.isUnlocked);
        setBusinessTotalUnread(result.totalUnread);
      } catch {
        if (!isBusinessFetchCurrent(fetchGen)) return;
        setConversations([]);
        setIsUnlocked(false);
        setBusinessTotalUnread(0);
      } finally {
        if (isBusinessFetchCurrent(fetchGen)) {
          setLoading(false);
        }
      }
      return;
    }

    if (!firebaseUser) {
      setConversations([]);
      setIsUnlocked(false);
      setUserTotalUnread(0);
      setLoading(false);
      return;
    }

    const fetchGen = beginUserFetch();
    setLoading(true);
    try {
      const result = await loadMessagingInbox(firebaseUser.uid);
      if (!isUserFetchCurrent(fetchGen)) return;
      setConversations(result.conversations);
      setIsUnlocked(result.isUnlocked);
      setUserTotalUnread(result.totalUnread);
    } catch {
      if (!isUserFetchCurrent(fetchGen)) return;
      setConversations([]);
      setIsUnlocked(false);
      setUserTotalUnread(0);
    } finally {
      if (isUserFetchCurrent(fetchGen)) {
        setLoading(false);
      }
    }
  }, [
    audience,
    beginBusinessFetch,
    beginUserFetch,
    business?.id,
    firebaseUser,
    isBusinessFetchCurrent,
    isUserFetchCurrent,
    setBusinessTotalUnread,
    setUserTotalUnread,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  useEffect(() => {
    void refresh();
  }, [refresh, refreshToken]);

  return { conversations, isUnlocked, totalUnread, loading, refresh };
}
