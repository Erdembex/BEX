import React from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useMessagingInbox, MessagingAudience } from '@/hooks/useMessagingInbox';
import { useMessagingInboxStore } from '@/store/messagingInboxStore';
import { markConversationRead } from '@/features/messages/conversationsApi';
import { markConversationNotificationsRead } from '@/features/notifications/notificationsApi';
import { notifyMessagingInboxRead } from '@/store/messagingInboxStore';
import { triggerNotificationRefresh } from '@/store/notificationRefreshBridge';
import { ConversationRow } from '@/components/messaging/ConversationRow';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type MessagesInboxViewProps = {
  audience: MessagingAudience;
  chatRoute: (applicationId: string) => Href;
  showMenu?: boolean;
  onBack?: () => void;
};

export function MessagesInboxView({
  audience,
  chatRoute,
  showMenu = audience === 'user',
  onBack,
}: MessagesInboxViewProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();

  const LOCKED_COPY: Record<
    MessagingAudience,
    { title: string; text: string; primary: { label: string; route: Href }; secondary?: { label: string; route: Href } }
  > = {
    user: {
      title: t('messagesInboxView.lockedTitleUser'),
      text: t('messagesInboxView.lockedTextUser'),
      primary: { label: t('messagesInboxView.browseTasks'), route: '/(tabs)/tasks' as Href },
      secondary: { label: t('messagesInboxView.myApplications'), route: '/(tabs)/applications' as Href },
    },
    business: {
      title: t('messagesInboxView.lockedTitleBusiness'),
      text: t('messagesInboxView.lockedTextBusiness'),
      primary: { label: t('messagesInboxView.goToApplications'), route: '/(business)/applications' as Href },
      secondary: { label: t('messagesInboxView.backToPanel'), route: '/(business)/panel' as Href },
    },
  };

  const SUBTITLE: Record<MessagingAudience, string> = {
    user: t('messagesInboxView.subtitleUser'),
    business: t('messagesInboxView.subtitleBusiness'),
  };

  const { conversations, isUnlocked, loading, refresh } = useMessagingInbox(audience);
  const totalUnread = useMessagingInboxStore((s) =>
    audience === 'business' ? s.businessTotalUnread : s.userTotalUnread
  );
  const [refreshing, setRefreshing] = React.useState(false);
  const locked = LOCKED_COPY[audience];

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <TabScreen style={styles.safe}>
      {showMenu || onBack ? (
        <AppHeader
          title={t('messagesInboxView.headerTitle')}
          showMenu={showMenu && !onBack}
          onBack={onBack}
        />
      ) : (
        <View style={styles.bizHeader}>
          <Text style={styles.bizTitle}>{t('messagesInboxView.headerTitle')}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !isUnlocked ? (
        <View style={styles.lockedWrap}>
          <View style={styles.lockedCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>{locked.title}</Text>
            <Text style={styles.lockedText}>{locked.text}</Text>
            <Button
              title={locked.primary.label}
              onPress={() => router.push(locked.primary.route)}
              style={{ alignSelf: 'stretch', marginTop: Spacing[4] }}
            />
            {locked.secondary ? (
              <Button
                title={locked.secondary.label}
                variant="outline"
                onPress={() => router.push(locked.secondary!.route)}
                style={{ alignSelf: 'stretch' }}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.subtitle}>{SUBTITLE[audience]}</Text>
              {totalUnread > 0 ? (
                <Text style={styles.unreadHint}>{t('messagesInboxView.unreadHint', { count: totalUnread })}</Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('messagesInboxView.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => {
                void (async () => {
                  const unread = item.unreadCount;
                  if (item.conversationId) {
                    try {
                      await markConversationRead(item.conversationId);
                      notifyMessagingInboxRead(unread, audience);
                      await markConversationNotificationsRead(item.conversationId);
                      triggerNotificationRefresh();
                    } catch {
                      // sohbet ekranında tekrar denenecek
                    }
                  }
                  router.push(chatRoute(item.applicationId));
                })();
              }}
            />
          )}
        />
      )}
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  bizHeader: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bizTitle: { ...Typography.headingMedium, color: Colors.textPrimary, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  listHeader: {
    marginBottom: Spacing[4],
    gap: Spacing[1],
  },
  unreadHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    gap: Spacing[3],
  },
  lockedWrap: {
    flex: 1,
    padding: Spacing[5],
    justifyContent: 'center',
  },
  lockedCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
  },
  lockIcon: { fontSize: 44, marginBottom: Spacing[2] },
  lockedTitle: { ...Typography.headingMedium, color: Colors.textPrimary, textAlign: 'center' },
  lockedText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  empty: { paddingVertical: Spacing[10], alignItems: 'center' },
  emptyText: { ...Typography.bodyMedium, color: Colors.textTertiary },
}));
