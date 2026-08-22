import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { notificationsRepository, openNotificationTarget } from '@/features/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { BexNotification } from '@/types';
import { Button } from '@/components/ui';
import { AppHeader } from '@/components/navigation/AppHeader';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import {
  getNotificationVisual,
  groupNotificationsByDay,
  type NotificationSection,
} from './notificationDisplay';
import { useTranslation } from '@/i18n';

interface NotificationListScreenProps {
  showBack?: boolean;
}

function NotificationCard({
  item,
  onPress,
}: {
  item: BexNotification;
  onPress: () => void;
}) {
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const visual = getNotificationVisual(item.type);

  return (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        {!item.read ? <View style={styles.unreadDot} /> : <View style={styles.unreadDotPlaceholder} />}
        <View style={[styles.iconWrap, { backgroundColor: `${visual.tint}18` }]}>
          <Text style={[styles.iconText, { color: visual.tint }]}>{visual.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.cardTime}>
              {formatRelativeTime(item.createdAt) || (item.read ? t('notificationsScreen.read') : t('notificationsScreen.new'))}
            </Text>
          </View>
          <Text style={styles.cardBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function NotificationListScreen({ showBack = false }: NotificationListScreenProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { firebaseUser, bexUser } = useAuthStore();
  const { refreshUnread, unreadCount } = useNotifications();
  const [items, setItems] = useState<BexNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const sections = useMemo(() => groupNotificationsByDay(items), [items]);
  const hasUnread = items.some((n) => !n.read);

  const load = useCallback(async () => {
    if (!firebaseUser) return;
    const list = await notificationsRepository.getByUser(firebaseUser.uid);
    setItems(list);
    await refreshUnread();
  }, [firebaseUser, refreshUnread]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkAll = async () => {
    if (!firebaseUser) return;
    await notificationsRepository.markAllRead(firebaseUser.uid);
    await load();
  };

  const handlePress = async (item: BexNotification) => {
    if (!firebaseUser) return;

    if (!item.read) {
      await notificationsRepository.markRead(item.id, firebaseUser.uid);
      await refreshUnread();
    }

    await openNotificationTarget(item, bexUser?.role);
    await load();
  };

  const renderSectionHeader = ({ section }: { section: NotificationSection }) => (
    <Text style={styles.sectionTitle}>{section.title}</Text>
  );

  return (
    <Screen style={styles.safe}>
      {!showBack ? <AppHeader title={t('notificationsScreen.title')} showNotifications={false} /> : null}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {showBack ? (
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.back}>{t('notificationsScreen.back')}</Text>
              </TouchableOpacity>
            ) : null}
            {showBack ? <Text style={styles.title}>{t('notificationsScreen.title')}</Text> : null}
            {!showBack && unreadCount > 0 ? (
              <Text style={styles.subtitle}>{t('notificationsScreen.unreadCount', { count: unreadCount })}</Text>
            ) : null}
            {hasUnread ? (
              <Button
                title={t('notificationsScreen.markAllRead')}
                variant="ghost"
                size="sm"
                onPress={handleMarkAll}
                style={styles.markAllBtn}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>{t('notificationsScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('notificationsScreen.emptyText')}
            </Text>
          </View>
        }
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item }) => (
          <NotificationCard item={item} onPress={() => handlePress(item)} />
        )}
        SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[3] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary, marginBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing[1],
  },
  markAllBtn: { alignSelf: 'flex-start', marginTop: Spacing[2] },
  sectionTitle: {
    ...Typography.labelMedium,
    color: Colors.textMuted,
    marginBottom: Spacing[2],
    marginTop: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionGap: { height: Spacing[2] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 14,
  },
  unreadDotPlaceholder: {
    width: 8,
    marginTop: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  cardTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardTitleUnread: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  cardBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  cardTime: {
    ...Typography.caption,
    color: Colors.textMuted,
    flexShrink: 0,
  },
  empty: { alignItems: 'center', paddingTop: Spacing[12], paddingHorizontal: Spacing[6] },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[1] },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
}));
