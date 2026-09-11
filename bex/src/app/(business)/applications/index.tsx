import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Screen, TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { BUSINESS_TAB_BAR_HEIGHT } from '@/components/business/BusinessTabBar';
import { BusinessScreenHeader } from '@/components/business/BusinessScreenHeader';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { useBusiness } from '@/features/business/useBusiness';
import { applicationsRepository, tasksRepository, usersRepository } from '@/features/data';
import { Application, ApplicationStatus } from '@/types';
import { ApplicationCard } from '@/components/business';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type FilterKey = 'all' | 'pending' | 'submitted' | 'coupon';

export default function BusinessApplicationsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const tabBarPadding = useTabBarBottomPadding(BUSINESS_TAB_BAR_HEIGHT);
  const FILTERS: { key: FilterKey; label: string; statuses?: ApplicationStatus[] }[] = [
    { key: 'all', label: t('businessApplicationsScreen.filterAll') },
    { key: 'pending', label: t('businessApplicationsScreen.filterPending'), statuses: ['pending'] },
    { key: 'submitted', label: t('businessApplicationsScreen.filterSubmitted'), statuses: ['submitted'] },
    { key: 'coupon', label: t('businessApplicationsScreen.filterCoupon'), statuses: ['submission_approved'] },
  ];
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { business, loading: bizLoading } = useBusiness();
  const [applications, setApplications] = useState<Application[]>([]);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [applicantNames, setApplicantNames] = useState<Record<string, string>>({});
  const [portfolioThumbs, setPortfolioThumbs] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    if (!business) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const apps = await applicationsRepository.getByBusiness(business.id);
    setApplications(apps);

    const titles: Record<string, string> = {};
    for (const app of apps) {
      if (!titles[app.taskId]) {
        const task = await tasksRepository.getById(app.taskId);
        titles[app.taskId] = task?.title ?? t('businessApplicationsScreen.defaultTask');
      }
    }
    setTaskTitles(titles);

    const names = await usersRepository.getDisplayNames(apps.map((a) => a.userId));
    setApplicantNames(names);

    const uniqueUserIds = [...new Set(apps.map((a) => a.userId))];
    const thumbs: Record<string, string[]> = {};
    await Promise.all(
      uniqueUserIds.map(async (uid) => {
        const items = await usersRepository.getPortfolio(uid);
        thumbs[uid] = items.map((item) => item.imageUrl);
      })
    );
    setPortfolioThumbs(thumbs);
    setLoading(false);
  }, [business]);

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

  const filtered = useMemo(() => {
    let list = applications;
    if (taskId) {
      list = list.filter((a) => a.taskId === taskId);
    }
    const active = FILTERS.find((f) => f.key === filter);
    if (active?.statuses) {
      list = list.filter((a) => active.statuses!.includes(a.status));
    }
    return list;
  }, [applications, filter, taskId]);

  const taskFilterTitle = taskId ? taskTitles[taskId] : null;

  if ((bizLoading && !business) || (loading && applications.length === 0)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{t('businessApplicationsScreen.businessProfileNotFound')}</Text>
          <Text style={styles.emptyText}>{t('businessApplicationsScreen.businessProfileNotFoundHint')}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <TabScreen style={styles.safe}>
      <BusinessScreenHeader title={t('businessApplicationsScreen.title')} />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          {t('businessApplicationsScreen.subtitle', { shown: filtered.length, total: applications.length })}
        </Text>
        {taskFilterTitle ? (
          <TouchableOpacity
            onPress={() => router.replace('/(business)/applications/index' as Href)}
          >
            <Text style={styles.taskFilter}>
              {t('businessApplicationsScreen.taskFilterLabel', { title: taskFilterTitle })}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f.key && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📥</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? t('businessApplicationsScreen.emptyAll') : t('businessApplicationsScreen.emptyFiltered')}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? t('businessApplicationsScreen.emptyAllText')
                : t('businessApplicationsScreen.emptyFilteredText', { filter: FILTERS.find((f) => f.key === filter)?.label ?? '' })}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            taskTitle={taskTitles[item.taskId] ?? t('businessApplicationsScreen.defaultTask')}
            applicantName={applicantNames[item.userId] ?? t('businessApplicationsScreen.defaultApplicantName', { suffix: item.userId.slice(-4) })}
            portfolioThumbs={portfolioThumbs[item.userId]}
            onPress={() =>
              router.push({
                pathname: '/(business)/applications/[id]',
                params: { id: item.id },
              })
            }
            onViewProfile={
              item.status === 'pending'
                ? () =>
                    router.push({
                      pathname: '/user/[id]',
                      params: { id: item.userId },
                    } as Href)
                : undefined
            }
            onOpenChat={
              item.status === 'pending'
                ? () =>
                    router.push(`/(business)/messages/${item.id}` as Href)
                : undefined
            }
          />
        )}
      />
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  taskFilter: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing[1],
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  filterChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  filterTextActive: { color: Colors.primaryDark },
  list: { padding: Spacing[5], flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
  },
}));
