import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiClient } from '@/lib/api';
import { shouldUseDemoData } from '@/lib/devMode';
import { usesRestBackend } from '@/lib/restBackend';
import { setDevProfile } from '@/lib/devProfileStore';

let initializedForUser: string | null = null;
let lastPushToken: string | null = null;

export const PUSH_CHANNEL_ID = 'default';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function resolveExpoProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

/** Android kilit ekranı + banner için yüksek öncelikli kanal. */
export async function ensureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: 'Passla Bildirimleri',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D4B86A',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default',
    enableVibrate: true,
    showBadge: true,
  });
}

/** Sistem izin diyaloğunu açar (iOS alert/sound/badge). */
export async function requestNotificationPermissions(): Promise<boolean> {
  await ensureAndroidNotificationChannels();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') {
    return true;
  }

  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return result.status === 'granted';
}

async function registerPushTokenWithBackend(userId: string): Promise<string | null> {
  await ensureAndroidNotificationChannels();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    if (__DEV__) {
      console.warn('[push] Bildirim izni verilmedi — token kaydedilmedi.');
    }
    return null;
  }

  try {
    const projectId = resolveExpoProjectId();
    if (!projectId) {
      if (__DEV__) {
        console.warn(
          '[push] EAS project id yok. app.json extra.eas.projectId veya EXPO_PUBLIC_EAS_PROJECT_ID gerekli.'
        );
      }
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    lastPushToken = token;

    if (__DEV__) {
      console.log('[push] Expo push token:', token);
    }

    if (shouldUseDemoData()) {
      await setDevProfile(userId, { expoPushToken: token });
      return token;
    }

    if (await usesRestBackend()) {
      await apiClient.post('/api/device/fcm-token', {
        token,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });
      if (__DEV__) {
        console.log("[push] Token backend'e kaydedildi.");
      }
    }

    return token;
  } catch (err) {
    if (__DEV__) {
      console.warn('[push] Token alınamadı:', err);
    }
    return null;
  }
}

export const notificationService = {
  async initialize(userId: string, options?: { refresh?: boolean }): Promise<void> {
    if (!options?.refresh && initializedForUser === userId && lastPushToken) {
      return;
    }

    const token = await registerPushTokenWithBackend(userId);
    if (token) {
      initializedForUser = userId;
    }
  },

  async unregisterPushToken(): Promise<void> {
    const token = lastPushToken;
    if (!token) return;

    try {
      if (await usesRestBackend()) {
        await apiClient.delete('/api/device/fcm-token', {
          data: {
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          },
        });
        if (__DEV__) {
          console.log("[push] Token backend'den silindi.");
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[push] Token silinemedi:', err);
      }
    } finally {
      lastPushToken = null;
      initializedForUser = null;
    }
  },

  resetSession() {
    initializedForUser = null;
    lastPushToken = null;
  },

  requestNotificationPermissions,
  ensureAndroidNotificationChannels,

  async presentLocal(title: string, body: string, data?: Record<string, string>) {
    try {
      await ensureAndroidNotificationChannels();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          ...(Platform.OS === 'android' ? { channelId: PUSH_CHANNEL_ID } : {}),
        },
        trigger: null,
      });
    } catch {
      // İzin yoksa veya web'de sessizce atla
    }
  },

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Desteklenmeyen platform
    }
  },
};
