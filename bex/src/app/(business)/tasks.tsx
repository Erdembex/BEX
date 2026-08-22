import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useBusiness } from '@/features/business/useBusiness';
import { tasksRepository } from '@/features/data';
import { Task } from '@/types';
import { useCategoryLabels, useDifficultyLabels } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { shouldUseDemoData } from '@/lib/devMode';
import { confirmDialog } from '@/lib/confirmDialog';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BusinessTasksScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const CATEGORY_LABELS = useCategoryLabels();
  const DIFFICULTY_LABELS = useDifficultyLabels();
  const { business, loading: bizLoading } = useBusiness();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    const list = await tasksRepository.getByBusiness(business.id);
    setTasks(list);
    setLoading(false);
  }, [business]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visibleTasks = tasks.filter(
    (t) => t.status === 'active' || t.status === 'draft'
  );

  const activeCount = visibleTasks.filter((t) => t.status === 'active').length;

  const handleCancel = async (task: Task) => {
    if (!business) return;
    if ((task.acceptedApplicantCount ?? 0) > 0) {
      showToast(t('businessTasksScreen.cannotCancelAccepted'));
      return;
    }
    if (task.status !== 'active') {
      showToast(t('businessTasksScreen.alreadyNotActive'));
      return;
    }

    setActionId(task.id);
    try {
      if (shouldUseDemoData()) {
        await tasksRepository.setStatus(task.id, business.id, 'paused');
      } else {
        await tasksRepository.cancel(task.id);
      }
      setTasks((prev) => prev.filter((tk) => tk.id !== task.id));
      showToast(t('businessTasksScreen.cancelledToast'));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('businessTasksScreen.cancelFailedToast'));
      await load();
    } finally {
      setActionId(null);
    }
  };

  const canCancelTask = (task: Task) =>
    task.status === 'active' && (task.acceptedApplicantCount ?? 0) === 0;

  const handlePauseToggle = async (task: Task) => {
    if (!business) return;
    const pausing = task.status === 'active';
    if (!task.approvedByAdmin && pausing) {
      showToast(t('businessTasksScreen.pendingCannotClose'));
      return;
    }
    const restMode = !shouldUseDemoData();
    const title = pausing
      ? restMode
        ? t('businessTasksScreen.closeTaskTitle')
        : t('businessTasksScreen.pauseTaskTitle')
      : t('businessTasksScreen.restartTaskTitle');
    const message = pausing
      ? restMode
        ? t('businessTasksScreen.closeBody')
        : t('businessTasksScreen.pauseBody')
      : t('businessTasksScreen.restartBody');
    const confirmLabel = pausing
      ? restMode
        ? t('businessTasksScreen.close')
        : t('businessTasksScreen.pause')
      : t('businessTasksScreen.start');

    const ok = await confirmDialog(
      title,
      message,
      confirmLabel,
      t('businessTasksScreen.cancelDismiss'),
    );
    if (!ok) return;

    setActionId(task.id);
    try {
      await tasksRepository.setStatus(task.id, business.id, pausing ? 'paused' : 'active');
      showToast(
        pausing
          ? restMode
            ? t('businessTasksScreen.closedToast')
            : t('businessTasksScreen.pausedToast')
          : t('businessTasksScreen.reactivatedToast')
      );
      await load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : t('businessTasksScreen.actionFailedToast'));
    } finally {
      setActionId(null);
    }
  };

  if (bizLoading || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('businessTasksScreen.title')}</Text>
          {!shouldUseDemoData() ? (
            <Text style={styles.limitHint}>
              {t('businessTasksScreen.limitHint', { count: activeCount })}
            </Text>
          ) : null}
        </View>
        <Button
          title={t('businessTasksScreen.newTask')}
          size="sm"
          fullWidth={false}
          onPress={() => router.push('/(business)/create-task')}
          style={styles.newBtn}
        />
      </View>

      <FlatList
        data={visibleTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>{t('businessTasksScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('businessTasksScreen.emptyText')}</Text>
            <Button
              title={t('businessTasksScreen.createTask')}
              onPress={() => router.push('/(business)/create-task')}
              style={{ marginTop: Spacing[4] }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                router.navigate(`/(business)/applications/index?taskId=${item.id}` as Href)
              }
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.approvedByAdmin
                        ? Colors.successLight
                        : Colors.warningLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: item.approvedByAdmin ? Colors.success : Colors.warning },
                    ]}
                  >
                    {item.approvedByAdmin
                      ? item.status === 'paused'
                        ? t('businessTasksScreen.statusClosed')
                        : t('businessTasksScreen.statusLive')
                      : item.status === 'draft'
                        ? t('businessTasksScreen.statusDraft')
                        : t('businessTasksScreen.statusPendingApproval')}
                  </Text>
                </View>
              </View>
              <Text style={styles.meta}>
                {CATEGORY_LABELS[item.category]} · {DIFFICULTY_LABELS[item.difficulty]}
              </Text>
              <Text style={styles.reward}>{item.rewardDescription}</Text>
              <Text style={styles.applicants}>
                {item.currentApplicantCount}/{item.maxApplicants}{t('businessTasksScreen.applicantsSuffix')}
              </Text>
              {item.status === 'paused' ? (
                <Text style={styles.pausedLabel}>{t('businessTasksScreen.pausedBadge')}</Text>
              ) : null}
              <Text style={styles.tapHint}>{t('businessTasksScreen.viewApplications')}</Text>
            </TouchableOpacity>

            <View style={styles.actions}>
              {item.status === 'active' ? (
                canCancelTask(item) ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.cancelBtn]}
                    onPress={() => void handleCancel(item)}
                    disabled={actionId === item.id}
                  >
                    <Text style={[styles.actionText, styles.cancelText]}>
                      {actionId === item.id ? t('businessTasksScreen.cancelling') : t('businessTasksScreen.cancel')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => void handlePauseToggle(item)}
                    disabled={actionId === item.id}
                  >
                    <Text style={styles.actionText}>
                      {shouldUseDemoData() ? t('businessTasksScreen.pause') : t('businessTasksScreen.close')}
                    </Text>
                  </TouchableOpacity>
                )
              ) : null}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[2],
  },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  limitHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  newBtn: { paddingHorizontal: Spacing[4], minWidth: 90 },
  list: { padding: Spacing[5], paddingTop: Spacing[2], flexGrow: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  cardTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: { ...Typography.caption, fontWeight: '600' },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing[1] },
  reward: { ...Typography.bodySmall, color: Colors.primaryDark, fontWeight: '600' },
  applicants: { ...Typography.caption, color: Colors.textTertiary, marginTop: Spacing[2] },
  pausedLabel: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    marginTop: Spacing[1],
  },
  actions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  actionBtn: {
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  cancelBtn: { borderColor: Colors.error },
  cancelText: { color: Colors.error },
  adminWait: {
    ...Typography.caption,
    color: Colors.warning,
    fontWeight: '600',
    paddingVertical: Spacing[1],
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    marginTop: Spacing[2],
    fontWeight: '600',
  },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing[3] },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: { ...Typography.bodyMedium, color: Colors.textSecondary, marginTop: Spacing[1] },
}));
