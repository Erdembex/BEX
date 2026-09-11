import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { notificationService, requestNotificationPermissions } from '@/features/notifications/notificationService';
import { triggerNotificationRefresh } from '@/store/notificationRefreshBridge';

const PROMPT_SEEN_KEY = '@passla/notification_rationale_v1';

type NotificationPermissionPromptProps = {
  onGranted?: () => void;
};

export function NotificationPermissionPrompt({ onGranted }: NotificationPermissionPromptProps) {
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.firebaseUser?.uid);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !userId) return;

    let cancelled = false;

    void (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (cancelled || status === 'granted') return;

      const seen = await AsyncStorage.getItem(PROMPT_SEEN_KEY);
      if (cancelled || seen === '1') return;

      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dismiss = async () => {
    await AsyncStorage.setItem(PROMPT_SEEN_KEY, '1');
    setVisible(false);
  };

  const allow = async () => {
    await AsyncStorage.setItem(PROMPT_SEEN_KEY, '1');
    setVisible(false);

    const granted = await requestNotificationPermissions();
    if (granted && userId) {
      await notificationService.initialize(userId, { refresh: true });
      triggerNotificationRefresh();
      onGranted?.();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: Colors.surface, borderColor: Colors.border }]}>
          <Text style={styles.icon}>🔔</Text>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>
            {t('notificationPermission.title')}
          </Text>
          <Text style={[styles.body, { color: Colors.textSecondary }]}>
            {t('notificationPermission.body')}
          </Text>
          <Button title={t('notificationPermission.allow')} onPress={allow} style={styles.btn} />
          <Button title={t('notificationPermission.later')} variant="ghost" onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: Spacing[5],
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[3],
  },
  icon: { fontSize: 40 },
  title: {
    ...Typography.headingMedium,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  btn: { alignSelf: 'stretch' },
});
