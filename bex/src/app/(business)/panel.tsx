import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { applicationsRepository, tasksRepository } from '@/features/data';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { BusinessListingProjectCard } from '@/components/business';
import { Typography, Spacing, Radius, useThemeColors, useThemeShadow } from '@/theme';
import { BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { getGreeting } from '@/lib/taskUtils';
import { Task } from '@/types';

export default function BusinessDashboardScreen() {
  const { bexUser } = useAuthStore();
  const { business, loading, reload } = useBusiness();
  const Colors = useThemeColors();
  const ThemeShadow = useThemeShadow();
  const { t } = useTranslation();
  const tabBarPadding = useTabBarBottomPadding(56);
  const styles = useMemo(() => createStyles(Colors, ThemeShadow), [Colors, ThemeShadow]);
  const { totalUnread: messageUnread } = useMessagingInbox('business');
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState({
    newApplications: 0,
    inProgressApps: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const displayName = business?.name ?? bexUser?.displayName ?? t('common.user');

  const loadDashboard = useCallback(async () => {
    if (!business) return;
    const [apps, tasks] = await Promise.all([
      applicationsRepository.getByBusiness(business.id),
      tasksRepository.getByBusiness(business.id),
    ]);
    const ongoing = tasks
      .filter((task) => task.status === 'active' || task.status === 'draft')
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
    setActiveTasks(ongoing);
    setStats({
      newApplications: apps.filter((a) => a.status === 'pending').length,
      inProgressApps:
        apps.filter((a) => ['approved', 'submitted', 'submission_approved'].includes(a.status))
          .length,
    });
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    await loadDashboard();
    setRefreshing(false);
  };

  const gridTasks = activeTasks.slice(0, 4);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <TabScreen style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings' as Href)}
            hitSlop={8}
          >
            <Ionicons name="grid-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('tabsBusiness.panel')}</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(business)/notifications' as Href)}
            hitSlop={8}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
            {messageUnread > 0 ? <View style={styles.notifDot} /> : null}
          </TouchableOpacity>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greetingSmall}>{getGreeting(undefined, t, 'business')}</Text>
          <Text style={styles.greetingName}>
            {t('businessDashboardScreen.greetingName', { name: displayName })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.88}
          onPress={() => router.push('/(business)/profile-search' as Href)}
        >
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <Text style={styles.searchPlaceholder}>{t('businessDashboardScreen.searchPlaceholder')}</Text>
        </TouchableOpacity>

        <View style={[styles.welcomeBanner, ThemeShadow.sm]}>
          <View style={styles.welcomeTextWrap}>
            <Text style={styles.welcomeTitle}>{t('businessDashboardScreen.welcomeTitle')}</Text>
            <Text style={styles.welcomeSubtitle}>{t('businessDashboardScreen.welcomeSubtitle')}</Text>
          </View>
          <View style={styles.welcomeArt}>
            <Ionicons name="briefcase" size={34} color={Colors.primary} />
          </View>
        </View>

        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={styles.summaryChip}
            onPress={() => router.push('/(business)/applications' as Href)}
          >
            <Text style={styles.summaryValue}>{stats.newApplications}</Text>
            <Text style={styles.summaryLabel}>{t('business.panel.stats.newApplications')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.summaryChip}
            onPress={() => router.push('/(business)/applications' as Href)}
          >
            <Text style={styles.summaryValue}>{stats.inProgressApps}</Text>
            <Text style={styles.summaryLabel}>{t('business.panel.stats.inProgress')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('businessDashboardScreen.ongoingListings')}</Text>
          <TouchableOpacity onPress={() => router.push('/(business)/tasks' as Href)}>
            <Text style={styles.viewAll}>{t('common.seeAll')}</Text>
          </TouchableOpacity>
        </View>

        {gridTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>{t('businessDashboardScreen.noListingsTitle')}</Text>
            <Text style={styles.emptyText}>{t('businessDashboardScreen.noListingsText')}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(business)/create-task' as Href)}
            >
              <Ionicons name="add" size={18} color={BRAND_NAVY_TEXT} />
              <Text style={styles.emptyBtnText}>{t('businessDashboardScreen.createListing')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectGrid}>
            {gridTasks.map((task, index) => (
              <BusinessListingProjectCard
                key={task.id}
                task={task}
                highlighted={index === 0}
                onPress={() => router.push(`/(business)/edit-task/${task.id}` as Href)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </TabScreen>
  );
}

function createStyles(
  Colors: ReturnType<typeof useThemeColors>,
  Shadow: ReturnType<typeof useThemeShadow>
) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll: { paddingHorizontal: Spacing[5], paddingTop: Spacing[2], gap: Spacing[4] },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing[1],
    },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notifDot: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.error,
    },
    topTitle: {
      ...Typography.labelLarge,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    greetingBlock: {
      gap: 4,
    },
    greetingSmall: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      fontWeight: '600',
    },
    greetingName: {
      ...Typography.displayMedium,
      color: Colors.textPrimary,
      fontSize: 28,
      lineHeight: 34,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[4],
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    searchPlaceholder: {
      ...Typography.bodyMedium,
      color: Colors.textMuted,
      flex: 1,
    },
    welcomeBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing[5],
      borderWidth: 1,
      borderColor: Colors.borderLight,
      gap: Spacing[3],
    },
    welcomeTextWrap: {
      flex: 1,
      gap: Spacing[1],
    },
    welcomeTitle: {
      ...Typography.headingSmall,
      color: Colors.textPrimary,
      fontWeight: '800',
    },
    welcomeSubtitle: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      lineHeight: 20,
    },
    welcomeArt: {
      width: 64,
      height: 64,
      borderRadius: Radius.lg,
      backgroundColor: Colors.businessLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing[3],
    },
    summaryChip: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing[4],
      borderWidth: 1,
      borderColor: Colors.borderLight,
      gap: 4,
    },
    summaryValue: {
      ...Typography.headingMedium,
      color: Colors.textPrimary,
      fontWeight: '800',
    },
    summaryLabel: {
      ...Typography.caption,
      color: Colors.textSecondary,
      fontWeight: '600',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing[1],
    },
    sectionTitle: {
      ...Typography.headingSmall,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    viewAll: {
      ...Typography.labelMedium,
      color: Colors.primary,
      fontWeight: '700',
    },
    projectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing[3],
    },
    emptyCard: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Spacing[6],
      alignItems: 'center',
      gap: Spacing[3],
      borderWidth: 1,
      borderColor: Colors.borderLight,
      ...Shadow.card,
    },
    emptyTitle: {
      ...Typography.labelLarge,
      color: Colors.textPrimary,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyText: {
      ...Typography.bodySmall,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emptyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[2],
      backgroundColor: BRAND_NAVY,
      paddingHorizontal: Spacing[5],
      paddingVertical: Spacing[3],
      borderRadius: Radius.lg,
      marginTop: Spacing[2],
    },
    emptyBtnText: {
      ...Typography.labelMedium,
      color: BRAND_NAVY_TEXT,
      fontWeight: '700',
    },
  });
}
