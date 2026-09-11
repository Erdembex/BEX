import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { adminRepository } from '@/features/admin';
import { Business } from '@/types';
import { BUSINESS_CATEGORY_LABELS, VERIFICATION_STATUS_LABELS } from '@/constants/businessLabels';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminVerificationsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await adminRepository.getPendingVerifications();
    setBusinesses(list);
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

  const handleApprove = async (biz: Business) => {
    setLoadingId(biz.id);
    try {
      await adminRepository.approveBusinessVerification(biz.id);
      showToast(t('adminVerificationsScreen.approvedToast', { name: biz.name }));
      await load();
    } catch {
      showToast(t('adminVerificationsScreen.approveFailedToast'));
    }
    setLoadingId(null);
  };

  const handleReject = (biz: Business) => {
    Alert.alert(t('adminVerificationsScreen.rejectTitle'), t('adminVerificationsScreen.rejectBody', { name: biz.name }), [
      { text: t('adminVerificationsScreen.dismiss'), style: 'cancel' },
      {
        text: t('adminVerificationsScreen.reject'),
        style: 'destructive',
        onPress: async () => {
          setLoadingId(biz.id);
          try {
            await adminRepository.rejectBusinessVerification(biz.id);
            showToast(t('adminVerificationsScreen.rejectedToast'));
            await load();
          } catch {
            showToast(t('adminVerificationsScreen.rejectFailedToast'));
          }
          setLoadingId(null);
        },
      },
    ]);
  };

  return (
    <Screen style={styles.safe}>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>{t('adminVerificationsScreen.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('adminVerificationsScreen.title')}</Text>
            <Text style={styles.subtitle}>{t('adminVerificationsScreen.subtitle', { count: businesses.length })}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('adminVerificationsScreen.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {BUSINESS_CATEGORY_LABELS[item.category]} ·{' '}
              {VERIFICATION_STATUS_LABELS[item.verificationStatus ?? 'pending']}
            </Text>
            <Text style={styles.address}>📍 {item.address}</Text>
            {item.verificationDocumentUrl ? (
              <AuthenticatedImage
                uri={item.verificationDocumentUrl}
                style={styles.docPreview}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.actions}>
              <Button
                title={t('adminVerificationsScreen.approve')}
                size="md"
                onPress={() => handleApprove(item)}
                loading={loadingId === item.id}
                style={{ flex: 1 }}
              />
              <Button
                title={t('adminVerificationsScreen.reject')}
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
  name: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  meta: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[1] },
  address: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing[2] },
  docLink: { ...Typography.labelMedium, color: Colors.primary, marginBottom: Spacing[4] },
  docPreview: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing[4],
  },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
}));
