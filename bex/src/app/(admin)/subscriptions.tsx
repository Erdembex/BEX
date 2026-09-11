import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import {
  fetchPendingSubscriptionUpgrades,
  confirmSubscriptionPayment,
  rejectSubscriptionPayment,
  PendingSubscriptionUpgrade,
} from '@/features/admin/adminSubscriptionsApi';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation, getLocale } from '@/i18n';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(getLocale() === 'en' ? 'en-US' : 'tr-TR');
}

export default function AdminSubscriptionsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const PERIOD_LABELS: Record<string, string> = {
    MONTHLY: t('adminSubscriptionsScreen.periodMonthly'),
    SEMIANNUAL: t('adminSubscriptionsScreen.periodSemiannual'),
    YEARLY: t('adminSubscriptionsScreen.periodYearly'),
  };
  const { showToast } = useToast();
  const [requests, setRequests] = useState<PendingSubscriptionUpgrade[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await fetchPendingSubscriptionUpgrades();
      setRequests(list);
    } catch {
      showToast(t('adminSubscriptionsScreen.loadFailed'));
    }
  }, [showToast, t]);

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

  const handleConfirm = async (item: PendingSubscriptionUpgrade) => {
    setLoadingId(item.businessId);
    try {
      await confirmSubscriptionPayment(item.businessId);
      showToast(t('adminSubscriptionsScreen.confirmedToast', { business: item.businessName, plan: item.targetPlanDisplayName }));
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('adminSubscriptionsScreen.confirmFailedToast'));
    }
    setLoadingId(null);
  };

  const handleReject = (item: PendingSubscriptionUpgrade) => {
    Alert.alert(
      t('adminSubscriptionsScreen.rejectTitle'),
      t('adminSubscriptionsScreen.rejectBody', { business: item.businessName, plan: item.targetPlanDisplayName }),
      [
        { text: t('adminSubscriptionsScreen.dismiss'), style: 'cancel' },
        {
          text: t('adminSubscriptionsScreen.reject'),
          style: 'destructive',
          onPress: async () => {
            setLoadingId(item.businessId);
            try {
              await rejectSubscriptionPayment(item.businessId);
              showToast(t('adminSubscriptionsScreen.rejectedToast'));
              await load();
            } catch {
              showToast(t('adminSubscriptionsScreen.rejectFailedToast'));
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
        data={requests}
        keyExtractor={(item) => item.businessId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>{t('adminSubscriptionsScreen.back')}</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{t('adminSubscriptionsScreen.title')}</Text>
            <Text style={styles.subtitle}>{t('adminSubscriptionsScreen.subtitle', { count: requests.length })}</Text>
            <Text style={styles.note}>
              {t('adminSubscriptionsScreen.note')}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('adminSubscriptionsScreen.empty')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.businessName}</Text>
            <Text style={styles.meta}>
              {item.currentPlanDisplayName} → {item.targetPlanDisplayName} ·{' '}
              {PERIOD_LABELS[item.billingPeriod] ?? item.billingPeriod}
            </Text>
            <Text style={styles.reference}>{t('adminSubscriptionsScreen.reference', { reference: item.reference })}</Text>
            <Text style={styles.date}>{t('adminSubscriptionsScreen.requestDate', { date: formatDate(item.requestedAt) })}</Text>
            <View style={styles.actions}>
              <Button
                title={t('adminSubscriptionsScreen.confirmPayment')}
                size="md"
                onPress={() => handleConfirm(item)}
                loading={loadingId === item.businessId}
                style={{ flex: 1 }}
              />
              <Button
                title={t('adminSubscriptionsScreen.reject')}
                variant="outline"
                size="md"
                onPress={() => handleReject(item)}
                disabled={loadingId === item.businessId}
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
  note: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing[3],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing[3],
    lineHeight: 17,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  name: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing[1] },
  reference: { ...Typography.caption, color: Colors.primary, marginBottom: 2 },
  date: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing[3] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  empty: { alignItems: 'center', paddingTop: Spacing[10] },
  emptyText: { ...Typography.bodyMedium, color: Colors.textMuted },
}));
