import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { businessesRepository, tasksRepository, EnrichedTask } from '@/features/data';
import { Business } from '@/types';
import { useBusinessCategoryLabels } from '@/constants/businessLabels';
import { useTranslation } from '@/i18n';
import { TaskCard } from '@/components/tasks';
import { ProfileFeedbackList } from '@/components/profile/ProfileFeedbackList';
import { DangerBadge } from '@/components/profile/DangerBadge';
import { Button } from '@/components/ui';
import { BlockUserButton } from '@/components/user/BlockUserButton';
import { fetchProfileFeedback, FeedbackDto } from '@/features/feedback/feedbackApi';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

export default function BusinessDetailScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const BUSINESS_CATEGORY_LABELS = useBusinessCategoryLabels();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [feedback, setFeedback] = useState<FeedbackDto[]>([]);
  const [feedbackAvg, setFeedbackAvg] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [biz, taskList] = await Promise.all([
      businessesRepository.getById(id),
      tasksRepository.getPublicActiveByBusiness(id),
    ]);
    setBusiness(biz);
    setTasks(taskList);
    if (biz?.id) {
      try {
        const summary = await fetchProfileFeedback(biz.id, 8);
        setFeedback(summary.recent);
        setFeedbackAvg(summary.averageStars);
        setFeedbackCount(summary.totalCount);
      } catch {
        setFeedback([]);
        setFeedbackAvg(biz.averageRating ?? 0);
        setFeedbackCount(biz.feedbackCount ?? 0);
      }
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{t('businessDetailScreen.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('businessDetailScreen.backLink')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('businessDetailScreen.back')}</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>{business.name.charAt(0)}</Text>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{business.name}</Text>
            <Text style={styles.category}>
              {BUSINESS_CATEGORY_LABELS[business.category]}
            </Text>
          </View>
          {business.isVerified ? (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>{t('businessDetailScreen.verified')}</Text>
            </View>
          ) : null}
          {business.complaintListed && !business.isDangerous ? (
            <View style={styles.complaintBadge}>
              <Text style={styles.complaintText}>{t('businessDetailScreen.complaintTag')}</Text>
            </View>
          ) : null}
          {business.isDangerous ? <DangerBadge /> : null}
        </View>

        <Text style={styles.address}>📍 {business.address}</Text>
        {(business.completedTaskCount ?? 0) > 0 ? (
          <Text style={styles.trustMeta}>
            {t('businessDetailScreen.trustMeta', {
              completed: business.completedTaskCount ?? 0,
              approved: business.approvedComplaintCount ?? 0,
              rate:
                (business.complaintRate ?? 0) > 0
                  ? ` · %${Math.round((business.complaintRate ?? 0) * 100)}`
                  : '',
            })}
          </Text>
        ) : null}
        <Text style={styles.score}>
          ⭐ {(feedbackAvg || business.averageRating || 0).toFixed(1)} ·{' '}
          {feedbackCount || business.feedbackCount || 0}
          {t('businessDetailScreen.reviewsSuffix')}
        </Text>

        <Button
          title={t('businessDetailScreen.reportBusiness')}
          variant="outline"
          onPress={() =>
            router.push({
              pathname: '/complaint/submit',
              params: { businessId: business.id },
            })
          }
        />

        {business.ownerUid ? (
          <BlockUserButton
            targetUserId={business.ownerUid}
            displayName={business.name}
            variant="outline"
            onBlocked={() => {
              if (router.canGoBack()) router.back();
            }}
          />
        ) : null}

        <ProfileFeedbackList
          averageStars={feedbackAvg || business.averageRating || 0}
          totalCount={feedbackCount || business.feedbackCount || 0}
          items={feedback}
        />

        <Text style={styles.sectionTitle}>{t('businessDetailScreen.activeTasks')}</Text>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>{t('businessDetailScreen.noActiveTasks')}</Text>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.taskWrap}>
              <TaskCard
                task={task}
                businessName={business.name}
                businessVerified={business.isVerified}
                businessIsDangerous={business.isDangerous}
                compact
                onPress={() => router.push(`/task/${task.id}` as Href)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  error: { ...Typography.bodyMedium, color: Colors.error },
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  logo: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 28, fontWeight: '800', color: Colors.textOnPrimary },
  heroText: { flex: 1, gap: 4 },
  name: { ...Typography.headingLarge, color: Colors.textPrimary },
  category: { ...Typography.bodySmall, color: Colors.textSecondary },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifiedText: { ...Typography.caption, color: Colors.success, fontWeight: '700' },
  complaintBadge: {
    backgroundColor: Colors.error + '18',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  complaintText: { ...Typography.caption, color: Colors.error, fontWeight: '700' },
  address: { ...Typography.bodyMedium, color: Colors.textSecondary },
  trustMeta: { ...Typography.caption, color: Colors.textMuted },
  score: { ...Typography.bodySmall, color: Colors.textTertiary },
  sectionTitle: { ...Typography.headingSmall, color: Colors.textPrimary, marginTop: Spacing[2] },
  empty: { ...Typography.bodyMedium, color: Colors.textTertiary },
  taskWrap: { marginBottom: Spacing[3] },
}));
