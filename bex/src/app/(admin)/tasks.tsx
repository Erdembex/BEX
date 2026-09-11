import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { adminRepository } from '@/features/admin';
import type { EnrichedTask } from '@/features/data/businessesRepository';
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminTasksScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingTasks();
    setTasks(list);
  }, []);

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

  const handleApprove = async (task: EnrichedTask) => {
    setLoadingId(task.id);
    try {
      await adminRepository.approveTask(task.id);
      showToast(t('adminTasksScreen.approvedToast'));
      await load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('adminTasksScreen.approveFailedToast');
      showToast(msg);
      console.error('[AdminTasks] approveTask hatası:', msg);
    }
    setLoadingId(null);
  };

  const handleReject = (task: EnrichedTask) => {
    Alert.alert(t('adminTasksScreen.rejectTitle'), t('adminTasksScreen.rejectBody', { title: task.title }), [
      { text: t('adminTasksScreen.dismiss'), style: 'cancel' },
      {
        text: t('adminTasksScreen.reject'),
        style: 'destructive',
        onPress: async () => {
          setLoadingId(task.id);
          try {
            await adminRepository.rejectTask(task.id);
            showToast(t('adminTasksScreen.rejectedToast'));
            await load();
          } catch {
            showToast(t('adminTasksScreen.rejectFailedToast'));
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  return (
    <Screen style={styles.safe}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>{t('adminTasksScreen.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('adminTasksScreen.title')}</Text>
            <Text style={styles.subtitle}>
              {t('adminTasksScreen.subtitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {t('adminTasksScreen.empty')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.title}</Text>
            <Text style={styles.business}>{item.businessName}</Text>
            <Text style={styles.meta}>
              {CATEGORY_LABELS[item.category]} · {DIFFICULTY_LABELS[item.difficulty]} · 🎁{' '}
              {item.rewardDescription}
            </Text>
            <Text style={styles.desc} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.actions}>
              <Button
                title={t('adminTasksScreen.approve')}
                size="md"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title={t('adminTasksScreen.reject')}
                variant="outline"
                size="md"
                onPress={() => handleReject(item)}
                disabled={loadingId === item.id}
                style={{ flex: 1 }}
                textStyle={{ color: Colors.error }}
              />
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing[5], paddingBottom: Spacing[10], flexGrow: 1 },
  header: { marginBottom: Spacing[4] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary, marginBottom: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  business: { ...Typography.bodySmall, color: Colors.primary, marginBottom: Spacing[1] },
  meta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[2] },
  desc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing[4] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
}));
