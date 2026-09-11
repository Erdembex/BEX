import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import {
  notificationService,
  notificationsRepository,
} from '@/features/notifications';
import { registerNotificationRefresh } from '@/store/notificationRefreshBridge';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';

/** Bildirim rozeti — yönlendirme dinleyicisi yok (AppHeader / tab ekranları için). */
export function useNotificationUnreadCount() {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid ?? null;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const count = await notificationsRepository.getUnreadCount(userId);
    setUnreadCount(count);
    await notificationService.setBadgeCount(count);
  }, [userId]);

  useEffect(() => {
    return registerNotificationRefresh(refreshUnread);
  }, [refreshUnread]);

  useEffect(() => {
    if (!userId) {
      notificationService.resetSession();
      return;
    }

    if (Platform.OS !== 'web') {
      void notificationService.initialize(userId);
    }

    const interval = setInterval(refreshUnread, 30000);

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        if (Platform.OS !== 'web') {
          void notificationService.initialize(userId, { refresh: true });
        }
        void refreshUnread();
      }
    };

    const appStateSub = AppState.addEventListener('change', onAppStateChange);

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [userId, refreshUnread]);

  return { unreadCount, refreshUnread };
}

/** Tam bildirim hook'u — yalnızca kök layout'ta bir kez çağırın. */
export function useNotifications() {
  const result = useNotificationUnreadCount();
  useNotificationNavigation(result.refreshUnread);
  return result;
}
