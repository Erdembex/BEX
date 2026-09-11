import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Timestamp } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { openNotificationTarget } from '@/features/notifications/notificationNavigation';
import { mapBackendNotificationType } from '@/features/notifications/notificationTypes';
import { refreshPendingFeedbackGate } from '@/components/feedback/PendingFeedbackGate';
import { BexNotification } from '@/types';
function buildNotificationFromPushData(
  data: Record<string, unknown>,
  userId: string
): BexNotification {
  const typeRaw = typeof data.type === 'string' ? data.type : '';
  const refType = typeof data.referenceType === 'string' ? data.referenceType.toUpperCase() : '';
  const applicationId =
    typeof data.applicationId === 'string'
      ? data.applicationId
      : typeof data.referenceId === 'string' && refType.includes('APPLICATION')
        ? data.referenceId
        : undefined;

  const mappedData: Record<string, string> = {};
  if (applicationId) mappedData.applicationId = applicationId;
  if (typeof data.referenceId === 'string') {
    mappedData.referenceId = data.referenceId;
    if (refType.includes('CONVERSATION')) {
      mappedData.conversationId = data.referenceId;
    }
  }
  if (typeof data.taskId === 'string') mappedData.taskId = data.taskId;
  if (typeof data.businessId === 'string') mappedData.businessId = data.businessId;

  return {
    id: typeof data.notificationId === 'string' ? data.notificationId : 'push',
    userId,
    title: '',
    body: '',
    type: mapBackendNotificationType(typeRaw),
    data: mappedData,
    read: false,
    createdAt: Timestamp.now(),
  };
}

/** Push bildirimine tıklanınca ilgili ekrana yönlendirir. */
export function useNotificationNavigation(onReceived?: () => void) {
  const { firebaseUser, bexUser } = useAuthStore();

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      if (!firebaseUser) return;
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      const item = buildNotificationFromPushData(data, firebaseUser.uid);
      void openNotificationTarget(item, bexUser?.role);
    },
    [firebaseUser, bexUser?.role]
  );

  useEffect(() => {
    if (Platform.OS === 'web' || !firebaseUser) return;

    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      onReceived?.();
      const rawType = notification.request.content.data?.type;
      const type =
        typeof rawType === 'string' ? mapBackendNotificationType(rawType) : '';
      if (type === 'coupon_issued') {
        refreshPendingFeedbackGate();
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponse(response);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        void handleNotificationResponse(response);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [firebaseUser, handleNotificationResponse, onReceived]);
}
