import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  tasksRepository,
  businessesRepository,
  applicationsRepository,
  EnrichedTask,
} from '@/features/data';
import { useAuthStore } from '@/store/authStore';
import { Application, Business } from '@/types';
import { formatDeadline, getDifficultyColor, isTaskOpenForApplications } from '@/lib/taskUtils';
import { TaskCard } from '@/components/tasks';
import { TaskDetailSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Button } from '@/components/ui';
import { DangerBadge } from '@/components/profile/DangerBadge';
import { Typography, Spacing, Radius, Shadow, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { useApplicationStatusLabels, useCategoryLabels, useDifficultyLabels } from '@/constants/taskLabels';

export default function TaskDetailScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const APPLICATION_STATUS_LABELS = useApplicationStatusLabels();
  const CATEGORY_LABELS = useCategoryLabels();
  const DIFFICULTY_LABELS = useDifficultyLabels();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuthStore();
  const [task, setTask] = useState<EnrichedTask | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [similar, setSimilar] = useState<EnrichedTask[]>([]);
  const [existingApp, setExistingApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const t = await tasksRepository.getEnrichedById(id);
    setTask(t);
    if (t) {
      const b = await businessesRepository.getById(t.businessId);
      setBusiness(b);
      const sim = await tasksRepository.getSimilar(t);
      setSimilar(sim);
    }
    if (firebaseUser && t) {
      const app = await applicationsRepository.getByUserAndTask(firebaseUser.uid, t.id);
      setExistingApp(app);
    } else {
      setExistingApp(null);
    }
    setLoading(false);
  }, [id, firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask])
  );

  const handlePrimaryAction = () => {
    if (!task) return;

    if (existingApp?.status === 'approved') {
      router.push(`/task/submit/${existingApp.id}` as Href);
      return;
    }
    if (existingApp?.status === 'rewarded') {
      router.push('/(tabs)/wallet' as Href);
      return;
    }
    if (existingApp) {
      router.push(`/application/${existingApp.id}` as Href);
      return;
    }

    if (!isTaskOpenForApplications(task)) {
      return;
    }

    router.push(`/task/apply/${task.id}`);
  };

  const taskOpen = task ? isTaskOpenForApplications(task) : false;

  const primaryLabel = (() => {
    if (!existingApp) {
      return taskOpen ? t('taskDetailScreen.apply') : t('taskDetailScreen.expired');
    }
    if (existingApp.status === 'rewarded') return t('taskDetailScreen.viewCoupon');
    if (existingApp.status === 'approved') return t('taskDetailScreen.submitTask');
    return t('taskDetailScreen.myApplication', { status: APPLICATION_STATUS_LABELS[existingApp.status] });
  })();

  if (loading) {
    return (
      <Screen style={styles.safe}>
        <TaskDetailSkeleton />
      </Screen>
    );
  }

  if (!task) {
    return (
      <View style={styles.loader}>
        <Text style={styles.error}>{t('taskDetailScreen.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('taskDetailScreen.backLink')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = getDifficultyColor(task.difficulty);

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('taskDetailScreen.back')}</Text>
        </TouchableOpacity>

        {task.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>{t('taskDetailScreen.featured')}</Text>
          </View>
        )}

        <Text style={styles.title}>{task.title}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.badge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.badgeText, { color: diffColor }]}>
              {DIFFICULTY_LABELS[task.difficulty]}
            </Text>
          </View>
          <Text style={styles.meta}>{t('taskDetailScreen.hoursSuffix', { count: task.estimatedHours })}</Text>
          <Text style={styles.meta}>{formatDeadline(task.deadline)}</Text>
        </View>

        {task.locationLabel ? (
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 {task.locationLabel}</Text>
          </View>
        ) : null}

        <View style={styles.rewardBox}>
          <Text style={styles.rewardLabel}>{t('taskDetailScreen.rewardLabel')}</Text>
          <Text style={styles.rewardValue}>🎁 {task.rewardDescription}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('taskDetailScreen.descriptionTitle')}</Text>
        <Text style={styles.description}>{task.description}</Text>

        {business && (
          <TouchableOpacity
            style={[styles.businessCard, Shadow.sm]}
            activeOpacity={0.85}
            onPress={() => router.push(`/business/${business.id}` as Href)}
          >
            <View style={styles.businessLogo}>
              <Text style={styles.businessLogoText}>{business.name.charAt(0)}</Text>
            </View>
            <View style={styles.businessInfo}>
              <View style={styles.businessNameRow}>
                <Text style={styles.businessName}>{business.name}</Text>
                {business.isDangerous ? <DangerBadge compact /> : null}
              </View>
              {business.isVerified ? (
                <Text style={styles.businessVerified}>{t('taskDetailScreen.verifiedBusiness')}</Text>
              ) : null}
              <Text style={styles.businessAddr}>📍 {business.address}</Text>
              <Text style={styles.businessScore}>
                ⭐ {business.reputationScore} · {CATEGORY_LABELS[task.category]}
              </Text>
              <Text style={styles.businessLink}>{t('taskDetailScreen.viewBusinessProfile')}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('taskDetailScreen.applications')}</Text>
            <Text style={styles.detailValue}>
              {task.currentApplicantCount}/{task.maxApplicants}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>{t('taskDetailScreen.category')}</Text>
            <Text style={styles.detailValue}>{CATEGORY_LABELS[task.category]}</Text>
          </View>
        </View>

        {!existingApp && !taskOpen ? (
          <Text style={styles.expiredHint}>
            {t('taskDetailScreen.expiredHint')}
          </Text>
        ) : null}

        {existingApp && existingApp.status !== 'approved' && existingApp.status !== 'rewarded' ? (
          <Text style={styles.appHint}>
            {t('taskDetailScreen.alreadyAppliedHint')}
          </Text>
        ) : null}

        <Button
          title={primaryLabel}
          onPress={handlePrimaryAction}
          disabled={!existingApp && !taskOpen}
          variant={!existingApp && !taskOpen ? 'outline' : 'primary'}
        />

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionTitle}>{t('taskDetailScreen.similarTasks')}</Text>
            {similar.map((t) => (
              <View key={t.id} style={{ marginBottom: Spacing[3] }}>
                <TaskCard
                  task={t}
                  businessName={t.businessName}
                  businessVerified={t.businessVerified}
                  businessIsDangerous={t.businessIsDangerous}
                  compact
                  onPress={() => router.replace(`/task/${t.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing[4] },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  error: { ...Typography.bodyMedium, color: Colors.error },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  featuredText: { ...Typography.caption, fontWeight: '700', color: Colors.textPrimary },
  title: { ...Typography.displayMedium, color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flexWrap: 'wrap' },
  badge: { paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: Radius.sm },
  badgeText: { ...Typography.caption, fontWeight: '700' },
  meta: { ...Typography.caption, color: Colors.textTertiary },
  locationRow: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  locationText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  rewardBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing[5],
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    gap: Spacing[2],
  },
  rewardLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  rewardValue: { ...Typography.headingSmall, color: Colors.textPrimary },
  sectionTitle: { ...Typography.headingSmall, color: Colors.textPrimary, marginTop: Spacing[2] },
  description: { ...Typography.bodyLarge, color: Colors.textSecondary, lineHeight: 24 },
  businessCard: {
    flexDirection: 'row',
    gap: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  businessLogo: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessLogoText: { fontSize: 22, fontWeight: '800', color: Colors.textOnPrimary },
  businessInfo: { flex: 1, gap: 4 },
  businessNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], flexWrap: 'wrap' },
  businessName: { ...Typography.labelLarge, color: Colors.textPrimary },
  businessVerified: { ...Typography.caption, color: Colors.success, fontWeight: '600' },
  businessAddr: { ...Typography.caption, color: Colors.textTertiary },
  businessScore: { ...Typography.caption, color: Colors.textSecondary },
  businessLink: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  detailsGrid: { flexDirection: 'row', gap: Spacing[3] },
  detailItem: {
    flex: 1,
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    gap: 4,
  },
  detailLabel: { ...Typography.caption, color: Colors.textTertiary },
  detailValue: { ...Typography.labelLarge, color: Colors.textPrimary },
  appHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: -Spacing[2],
  },
  expiredHint: {
    ...Typography.bodySmall,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  similarSection: { gap: Spacing[3], marginTop: Spacing[2] },
}));
