import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import {
  getBusinessAnalytics,
  BusinessAnalytics,
} from '@/features/business/businessAnalyticsService';
import { useCategoryLabels } from '@/constants/taskLabels';
import { StatCard } from '@/components/business';
import { BackHeader } from '@/components/navigation/BackHeader';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BusinessAnalyticsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const CATEGORY_LABELS = useCategoryLabels();
  const { business, loading: bizLoading, reload } = useBusiness();
  const [stats, setStats] = useState<BusinessAnalytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!business) return;
    const data = await getBusinessAnalytics(business.id);
    setStats(data);
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    await load();
    setRefreshing(false);
  };

  if (bizLoading || !stats) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <BackHeader title={t('businessAnalyticsScreen.title')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.title}>{t('businessAnalyticsScreen.title')}</Text>
        <Text style={styles.subtitle}>{business?.name}</Text>

        <Text style={styles.section}>{t('businessAnalyticsScreen.tasksSection')}</Text>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.published')} value={stats.publishedTasks} emoji="📋" />
          <StatCard label={t('businessAnalyticsScreen.active')} value={stats.activeTasks} emoji="🟢" />
        </View>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.pendingApproval')} value={stats.pendingApproval} emoji="⏳" />
          <StatCard label={t('businessAnalyticsScreen.completed')} value={stats.completedTasks} emoji="✅" />
        </View>

        <Text style={styles.section}>{t('businessAnalyticsScreen.applicationsSection')}</Text>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.total')} value={stats.totalApplications} emoji="📥" />
          <StatCard label={t('businessAnalyticsScreen.pending')} value={stats.pendingApplications} emoji="🕐" />
        </View>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.submitted')} value={stats.submittedApplications} emoji="📤" />
        </View>

        <Text style={styles.section}>{t('businessAnalyticsScreen.couponsSection')}</Text>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.distributed')} value={stats.couponsDistributed} emoji="🎟️" />
          <StatCard label={t('businessAnalyticsScreen.used')} value={stats.couponsUsed} emoji="✔️" />
        </View>
        <View style={styles.row}>
          <StatCard label={t('businessAnalyticsScreen.usageRate')} value={`%${stats.couponUseRate}`} emoji="📈" />
        </View>

        {stats.topCategory && (
          <View style={styles.insight}>
            <Text style={styles.insightTitle}>{t('businessAnalyticsScreen.topCategory')}</Text>
            <Text style={styles.insightValue}>
              {t('businessAnalyticsScreen.topCategoryValue', { category: CATEGORY_LABELS[stats.topCategory], count: stats.topCategoryCount })}
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[6] },
  section: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[4],
    marginBottom: Spacing[3],
  },
  row: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  insight: {
    marginTop: Spacing[6],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  insightTitle: { ...Typography.labelMedium, color: Colors.textSecondary },
  insightValue: { ...Typography.headingSmall, color: Colors.textPrimary, marginTop: Spacing[1] },
}));
