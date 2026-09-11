import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { confirmDialog } from '@/lib/confirmDialog';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import {
  approveComplaintAdmin,
  COMPLAINT_REASON_LABELS,
  COMPLAINT_TARGET_LABELS,
  fetchPendingComplaintsAdmin,
  rejectComplaintAdmin,
  type ComplaintModerationDto,
} from '@/features/complaint/complaintsApi';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminComplaintsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [items, setItems] = useState<ComplaintModerationDto[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const list = await fetchPendingComplaintsAdmin().catch(() => []);
    setItems(list);
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

  const handleApprove = async (item: ComplaintModerationDto) => {
    setLoadingId(item.id);
    try {
      await approveComplaintAdmin(item.id, item.targetType, notes[item.id]?.trim() || undefined);
      showToast(t('adminComplaintsScreen.approvedToast'));
      await load();
    } catch {
      showToast(t('adminComplaintsScreen.approveFailedToast'));
    }
    setLoadingId(null);
  };

  const handleReject = async (item: ComplaintModerationDto) => {
    const confirmed = await confirmDialog(
      t('adminComplaintsScreen.rejectTitle'),
      t('adminComplaintsScreen.rejectBody'),
      t('adminComplaintsScreen.reject'),
      t('adminComplaintsScreen.dismiss')
    );
    if (!confirmed) return;

    setLoadingId(item.id);
    try {
      await rejectComplaintAdmin(
        item.id,
        item.targetType,
        notes[item.id]?.trim() || t('adminComplaintsScreen.defaultRejectReason')
      );
      showToast(t('adminComplaintsScreen.rejectedToast'));
      await load();
    } catch {
      showToast(t('adminComplaintsScreen.rejectFailedToast'));
    }
    setLoadingId(null);
  };

  return (
    <Screen style={styles.safe}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.back} onPress={() => router.back()}>
              {t('adminComplaintsScreen.back')}
            </Text>
            <Text style={styles.title}>{t('adminComplaintsScreen.title')}</Text>
            <Text style={styles.subtitle}>
              {t('adminComplaintsScreen.subtitle')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{t('adminComplaintsScreen.empty')}</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.business}>{item.targetName}</Text>
            <Text style={styles.meta}>
              {COMPLAINT_TARGET_LABELS[item.targetType]} · {COMPLAINT_REASON_LABELS[item.reason]} ·{' '}
              {item.status}
            </Text>
            <Text style={styles.body}>{item.description}</Text>
            <Input
              label={t('adminComplaintsScreen.adminNoteLabel')}
              value={notes[item.id] ?? ''}
              onChangeText={(text) => setNotes((prev) => ({ ...prev, [item.id]: text }))}
              placeholder={t('adminComplaintsScreen.adminNotePlaceholder')}
            />
            <View style={styles.actions}>
              <Button
                title={t('adminComplaintsScreen.approve')}
                size="sm"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title={t('adminComplaintsScreen.reject')}
                variant="outline"
                size="sm"
                onPress={() => handleReject(item)}
                loading={loadingId === item.id}
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
  list: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  header: { gap: Spacing[2], marginBottom: Spacing[4] },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  empty: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing[8] },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  business: { ...Typography.labelLarge, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textMuted },
  body: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: Spacing[2] },
}));
