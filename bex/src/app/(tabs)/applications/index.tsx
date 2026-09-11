import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { USER_TAB_BAR_HEIGHT } from '@/components/home/UserTabBar';
import { router, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Application, ApplicationStatus } from '@/types';
import { useApplicationStatusLabels } from '@/constants/taskLabels';
import { useTranslation } from '@/i18n';
import { getApplicationQuickAction, getApplicationTarget } from '@/lib/applicationNavigation';
import { formatRelativeTime } from '@/lib/dateUtils';
import { TaskListSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

function useStatusColors(): Record<ApplicationStatus, string> {
  const Colors = useThemeColors();
  return {
    pending: Colors.warning,
    approved: Colors.info,
    rejected: Colors.error,
    submitted: Colors.primary,
    submission_approved: Colors.success,
    rewarded: Colors.success,
    cancelled: Colors.textTertiary,
  };
}

interface EnrichedApplication extends Application {
  taskTitle: string;
}

export default function MyApplicationsScreen() {
  const Colors = useThemeColors();
  const statusColors = useStatusColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding(24, USER_TAB_BAR_HEIGHT);
  const { t } = useTranslation();
  const APPLICATION_STATUS_LABELS = useApplicationStatusLabels();
  const { firebaseUser } = useAuthStore();
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!firebaseUser) return;

    if (shouldUseDemoData()) {
      demoStore.ensureSampleApplicationsForUser(firebaseUser.uid);
    }

    setLoading(true);
    const list = await applicationsRepository.getByUser(firebaseUser.uid);

    const enriched: EnrichedApplication[] = [];
    for (const app of list) {
      const task = await tasksRepository.getById(app.taskId);
      enriched.push({
        ...app,
        taskTitle: task?.title ?? t('common.task'),
      });
    }

    setApplications(enriched);
    setLoading(false);
  }, [firebaseUser]);

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

  const activeCount = applications.filter((a) =>
    ['pending', 'approved', 'submitted', 'submission_approved'].includes(a.status)
  ).length;

  if (loading) {
    return (
      <TabScreen style={styles.safe}>
        <AppHeader title={t('applicationsScreen.title')} showMenu showNotifications />
        <TaskListSkeleton count={3} />
      </TabScreen>
    );
  }

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('applicationsScreen.title')} showMenu showNotifications />
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.subtitle}>
              {t('applicationsScreen.summary', { active: activeCount, total: applications.length })}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{t('applicationsScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('applicationsScreen.emptyText')}
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/tasks' as Href)}
            >
              <Text style={styles.emptyBtnText}>{t('applicationsScreen.goToTasks')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const statusColor = statusColors[item.status];
          const quickAction = getApplicationQuickAction(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(getApplicationTarget(item))}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.taskTitle}
                </Text>
                <View
                  style={[styles.badge, { backgroundColor: statusColor + '22' }]}
                >
                  <Text style={[styles.badgeText, { color: statusColor }]}>
                    {APPLICATION_STATUS_LABELS[item.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.preview} numberOfLines={2}>
                {item.coverLetter}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                  {formatRelativeTime(item.createdAt) || '—'}
                </Text>
                <Text style={styles.tapHint}>
                  {quickAction ? t(quickAction.labelKey) : t('applicationsScreen.detail')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing[5], flexGrow: 1 },
  header: { marginBottom: Spacing[3], paddingHorizontal: Spacing[5], paddingTop: Spacing[1] },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  cardTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: { ...Typography.caption, fontWeight: '600' },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing[2],
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: { ...Typography.caption, color: Colors.textMuted },
  tapHint: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
    marginBottom: Spacing[5],
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  emptyBtnText: {
    ...Typography.labelLarge,
    color: Colors.textOnPrimary,
  },
}));
