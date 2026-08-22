import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, businessesRepository, tasksRepository, usersRepository } from '@/features/data';
import { canUseApplicationMessages } from '@/features/messages';
import { useMessagingInbox, MessagingAudience } from '@/hooks/useMessagingInbox';
import { ChatThreadView } from '@/components/messaging/ChatThreadView';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface MessageThreadScreenProps {
  applicationId: string;
  messagingAudience?: MessagingAudience;
}

export function MessageThreadScreen({
  applicationId,
  messagingAudience = 'user',
}: MessageThreadScreenProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { firebaseUser, bexUser } = useAuthStore();
  const { conversations } = useMessagingInbox(messagingAudience);
  const priorUnread =
    conversations.find((c) => c.applicationId === applicationId)?.unreadCount ?? 0;
  const [peerLabel, setPeerLabel] = useState(t('messageThreadScreen.defaultChat'));
  const [taskTitle, setTaskTitle] = useState(t('messageThreadScreen.defaultTask'));
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!applicationId || !firebaseUser || !bexUser) return;

      void (async () => {
        const app = await applicationsRepository.getById(applicationId);
        if (!app) {
          setAllowed(false);
          return;
        }

        const canChat = canUseApplicationMessages(app.status);
        setAllowed(canChat);
        if (!canChat) return;

        const task = await tasksRepository.getById(app.taskId);
        setTaskTitle(task?.title ?? t('messageThreadScreen.defaultTask'));

        if (bexUser.role === 'business') {
          setPeerLabel(await usersRepository.getDisplayName(app.userId));
        } else {
          const business = await businessesRepository.getById(app.businessId);
          setPeerLabel(business?.name ?? t('messageThreadScreen.defaultBusiness'));
        }
      })();
    }, [applicationId, firebaseUser, bexUser])
  );

  if (!applicationId || !firebaseUser || !bexUser) {
    return null;
  }

  if (allowed === null) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!allowed) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('messageThreadScreen.defaultChat')}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Text style={styles.blockedTitle}>{t('messageThreadScreen.notOpenedTitle')}</Text>
          <Text style={styles.blockedText}>
            {t('messageThreadScreen.notOpenedText')}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {peerLabel}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {taskTitle}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ChatThreadView
        applicationId={applicationId}
        currentUserId={firebaseUser.uid}
        currentUserRole={bexUser.role}
        variant="fullscreen"
        peerLabel={peerLabel}
        taskTitle={taskTitle}
        priorUnread={priorUnread}
        messagingAudience={messagingAudience}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing[2],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  headerMeta: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  blockedTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[2] },
  blockedText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
}));
