import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { authService } from '@/features/auth/authService';
import {
  applicationsRepository,
  tasksRepository,
} from '@/features/data';
import {
  getBusinessAnalytics,
} from '@/features/business/businessAnalyticsService';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { StatCard } from '@/components/business';
import { Button } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, useThemeColors, useThemeShadow } from '@/theme';
import { BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useTranslation } from '@/i18n';

export default function BusinessDashboardScreen() {
  const { bexUser, signOut } = useAuthStore();
  const { business, loading, reload } = useBusiness();
  const Colors = useThemeColors();
  const ThemeShadow = useThemeShadow();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(Colors, ThemeShadow), [Colors, ThemeShadow]);
  const { totalUnread: messageUnread, isUnlocked: messagingUnlocked } = useMessagingInbox('business');
  const [stats, setStats] = useState({
    newApplications: 0,
    inProgressApps: 0,
    activeTasks: 0,
    pendingApproval: 0,
    completedTasks: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    if (!business) return;
    const [apps, tasks, analytics] = await Promise.all([
      applicationsRepository.getByBusiness(business.id),
      tasksRepository.getByBusiness(business.id),
      getBusinessAnalytics(business.id).catch(() => null),
    ]);
    setStats({
      newApplications: apps.filter((a) => a.status === 'pending').length,
      inProgressApps: apps.filter((a) =>
        ['approved', 'submitted', 'submission_approved'].includes(a.status)
      ).length,
      activeTasks: analytics?.activeTasks ?? tasks.filter((t) => t.status === 'active').length,
      pendingApproval:
        analytics?.pendingApproval ?? tasks.filter((t) => !t.approvedByAdmin).length,
      completedTasks: analytics?.completedTasks ?? 0,
    });
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.hero}>
          <ProfileAvatar
            name={business?.name ?? bexUser?.displayName}
            avatarUrl={business?.logoUrl || bexUser?.avatarUrl}
            size={56}
          />
          <View style={styles.heroText}>
            <Text style={styles.greeting}>{t('business.panel.hello')}</Text>
            <Text style={styles.name}>{business?.name ?? bexUser?.displayName}</Text>
            {business?.isVerified ? (
              <Text style={styles.verified}>{t('business.panel.verified')}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('business.panel.logout')}</Text>
          </TouchableOpacity>
        </View>

        {messageUnread > 0 ? (
          <TouchableOpacity
            style={styles.messageCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.messageTitle}>
              {t('business.panel.unreadMessages', { count: messageUnread })}
            </Text>
            <Text style={styles.messageHint}>{t('business.panel.goToMessages')}</Text>
          </TouchableOpacity>
        ) : messagingUnlocked ? (
          <TouchableOpacity
            style={styles.messageCardMuted}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.messageTitleMuted}>{t('business.panel.chatCandidates')}</Text>
            <Text style={styles.messageHintMuted}>{t('business.panel.chatFromApproved')}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.statsRow}>
          <StatCard
            label={t('business.panel.stats.newApplications')}
            value={stats.newApplications}
            emoji="📥"
            onPress={() => router.push('/(business)/applications' as Href)}
          />
          <StatCard
            label={t('business.panel.stats.inProgress')}
            value={stats.inProgressApps}
            emoji="💬"
            onPress={() => router.push('/(business)/applications' as Href)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label={t('business.panel.stats.activeTasks')}
            value={stats.activeTasks}
            emoji="🎯"
            onPress={() => router.push('/(business)/tasks' as Href)}
          />
          <StatCard
            label={t('business.panel.stats.pendingApproval')}
            value={stats.pendingApproval}
            emoji="⏳"
            onPress={() => router.push('/(business)/tasks' as Href)}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard label={t('business.panel.stats.completedTasksLong')} value={stats.completedTasks} emoji="✅" />
          <StatCard
            label={t('businessDashboardScreen.averageRating')}
            value={business?.averageRating ? `${business.averageRating.toFixed(1)} ⭐` : '—'}
            emoji="🌟"
          />
        </View>
        {business?.feedbackCount ? (
          <Text style={styles.ratingHint}>
            {t('businessDashboardScreen.ratingHint', { count: business.feedbackCount })}
          </Text>
        ) : null}

        <Text style={styles.sectionTitle}>{t('businessDashboardScreen.quickAccess')}</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/messages' as Href)}
          >
            <Text style={styles.quickIcon}>💬</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickChat')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickChatHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/profile-search' as Href)}
          >
            <Text style={styles.quickIcon}>🔍</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickProfileSearch')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickProfileSearchHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/analytics' as Href)}
          >
            <Text style={styles.quickIcon}>📈</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickAnalytics')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickAnalyticsHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/notifications' as Href)}
          >
            <Text style={styles.quickIcon}>🔔</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickNotifications')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickNotificationsHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/complaint/submit-user' as Href)}
          >
            <Text style={styles.quickIcon}>⚠</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickUserComplaint')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickUserComplaintHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/complaints' as Href)}
          >
            <Text style={styles.quickIcon}>📋</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickMyComplaints')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickMyComplaintsHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(business)/subscription' as Href)}
          >
            <Text style={styles.quickIcon}>💳</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickSubscription')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickSubscriptionHint')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            activeOpacity={0.88}
            onPress={() => router.push('/settings' as Href)}
          >
            <Text style={styles.quickIcon}>⚙️</Text>
            <Text style={styles.quickLabel}>{t('businessDashboardScreen.quickSettings')}</Text>
            <Text style={styles.quickHint}>{t('businessDashboardScreen.quickSettingsHint')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('businessDashboardScreen.createTask')}
            onPress={() => router.push('/(business)/create-task')}
          />
          <Button
            title={t('businessDashboardScreen.reviewApplications')}
            variant="secondary"
            onPress={() => router.push('/(business)/applications')}
          />
          <Button
            title={t('businessDashboardScreen.verifyCoupon')}
            variant="outline"
            onPress={() => router.push('/(business)/coupons' as Href)}
          />
          {business && business.verificationStatus !== 'verified' && (
            <Button
              title={t('businessDashboardScreen.businessVerification')}
              variant="secondary"
              onPress={() => router.push('/(business)/verification' as Href)}
            />
          )}
        </View>

        <View style={styles.note}>
            <Text style={styles.noteTitle}>{t('business.panel.infoTitle')}</Text>
            <Text style={styles.noteText}>{t('business.panel.infoText')}</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(
  Colors: ReturnType<typeof useThemeColors>,
  Shadow: ReturnType<typeof useThemeShadow>
) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.xl,
    marginBottom: Spacing[2],
    backgroundColor: BRAND_NAVY,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    ...Shadow.card,
  },
  heroText: { flex: 1, gap: 2, minWidth: 0 },
  greeting: { ...Typography.bodySmall, color: 'rgba(240, 238, 233, 0.82)', fontWeight: '600' },
  name: { ...Typography.headingMedium, color: BRAND_NAVY_TEXT, fontWeight: '700' },
  verified: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  logoutText: { ...Typography.labelMedium, color: BRAND_NAVY_TEXT, fontWeight: '700' },
  messageCard: {
    padding: Spacing[4],
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: Spacing[1],
  },
  messageTitle: {
    ...Typography.labelLarge,
    color: Colors.accentDark,
    fontWeight: '700',
  },
  messageHint: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontWeight: '600',
  },
  messageCardMuted: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  messageTitleMuted: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  messageHintMuted: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  statSpacer: { flex: 1 },
  ratingHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: -Spacing[2],
    marginBottom: Spacing[2],
  },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[2],
    marginBottom: Spacing[2],
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  quickCard: {
    width: '47%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderGold,
    gap: 4,
  },
  quickIcon: { fontSize: 22 },
  quickLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  quickHint: { ...Typography.caption, color: Colors.textMuted },
  actions: { gap: Spacing[3], marginBottom: Spacing[6] },
  note: {
    backgroundColor: Colors.businessLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.business,
  },
  noteTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  noteText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  });
}
