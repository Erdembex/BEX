import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { adminRepository, EnrichedSubmission } from '@/features/admin/adminRepository';
import { Button, Input } from '@/components/ui';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { useToast } from '@/components/common/Toast';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminSubmissionsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<EnrichedSubmission[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingSubmissions();
    setSubmissions(list);
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

  const handleApprove = async (item: EnrichedSubmission) => {
    setLoadingId(item.id);
    try {
      await adminRepository.approveSubmission(item.id);
      showToast(t('adminSubmissionsScreen.approvedToast'));
      await load();
    } catch {
      showToast(t('adminSubmissionsScreen.approveFailedToast'));
    }
    setLoadingId(null);
  };

  const handleReject = (item: EnrichedSubmission) => {
    const note = rejectNote[item.id]?.trim();
    Alert.alert(
      t('adminSubmissionsScreen.rejectTitle'),
      t('adminSubmissionsScreen.rejectBody'),
      [
        { text: t('adminSubmissionsScreen.dismiss'), style: 'cancel' },
        {
          text: t('adminSubmissionsScreen.reject'),
          style: 'destructive',
          onPress: async () => {
            setLoadingId(item.id);
            try {
              await adminRepository.rejectSubmission(
                item.id,
                note || t('adminSubmissionsScreen.defaultRejectReason')
              );
              showToast(t('adminSubmissionsScreen.rejectedToast'));
              await load();
            } catch {
              showToast(t('adminSubmissionsScreen.rejectFailedToast'));
            }
            setLoadingId(null);
          },
        },
      ]
    );
  };

  return (
    <Screen style={styles.safe}>
      <FlatList
        data={submissions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>{t('adminSubmissionsScreen.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('adminSubmissionsScreen.title')}</Text>
            <Text style={styles.subtitle}>
              {t('adminSubmissionsScreen.subtitle', { count: submissions.length })}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('adminSubmissionsScreen.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.taskTitle}>{item.taskTitle}</Text>
            <Text style={styles.business}>{item.businessName}</Text>
            <Text style={styles.meta}>
              {t('adminSubmissionsScreen.applicantLabel', { name: item.applicantName })}
              {item.submittedAt
                ? ` · ${formatRelativeTime(item.submittedAt)}`
                : ''}
            </Text>

            {item.submissionText ? (
              <Text style={styles.desc}>{item.submissionText}</Text>
            ) : (
              <Text style={styles.descMuted}>{t('adminSubmissionsScreen.noDescription')}</Text>
            )}

            {item.submissionFiles.length > 0 ? (
              <ImagePreviewGrid urls={item.submissionFiles} />
            ) : null}

            <Input
              label={t('adminSubmissionsScreen.rejectReasonLabel')}
              value={rejectNote[item.id] ?? ''}
              onChangeText={(text) =>
                setRejectNote((prev) => ({ ...prev, [item.id]: text }))
              }
              placeholder={t('adminSubmissionsScreen.rejectReasonPlaceholder')}
              multiline
              numberOfLines={2}
              style={{ minHeight: 56, textAlignVertical: 'top', marginBottom: Spacing[3] }}
            />

            <View style={styles.actions}>
              <Button
                title={t('adminSubmissionsScreen.approve')}
                size="md"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title={t('adminSubmissionsScreen.reject')}
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
  desc: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing[3] },
  descMuted: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing[3] },
  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  fileImage: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
  },
  fileLinkText: { ...Typography.caption, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
}));
