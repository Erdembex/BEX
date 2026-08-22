import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import {
  useComplaintReasonLabels,
  fetchMyIndividualComplaintsBusiness,
  type IndividualComplaintDto,
} from '@/features/complaint/complaintsApi';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation, getLocale } from '@/i18n';

export default function BusinessComplaintsScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const COMPLAINT_REASON_LABELS = useComplaintReasonLabels();
  const STATUS_LABELS: Record<string, string> = {
    PENDING: t('businessComplaintsScreen.statusPending'),
    APPROVED: t('businessComplaintsScreen.statusApproved'),
    REJECTED: t('businessComplaintsScreen.statusRejected'),
  };
  const [items, setItems] = useState<IndividualComplaintDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await fetchMyIndividualComplaintsBusiness();
      setItems(list);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : t('businessComplaintsScreen.loadFailed'));
    }
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

  return (
    <Screen style={styles.safe}>
      <AppHeader title={t('businessComplaintsScreen.headerTitle')} showMenu={false} onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.lead}>
          {t('businessComplaintsScreen.lead')}
        </Text>

        <Button
          title={t('businessComplaintsScreen.newComplaint')}
          onPress={() => router.push('/complaint/submit-user' as Href)}
        />

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Button title={t('businessComplaintsScreen.retry')} variant="outline" onPress={load} />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('businessComplaintsScreen.sentComplaints', { count: items.length })}</Text>

        {items.length === 0 && !loadError ? (
          <Text style={styles.empty}>{t('businessComplaintsScreen.empty')}</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.targetName}>{item.individualDisplayName}</Text>
                <Text style={[styles.status, statusStyle(item.status, Colors)]}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </Text>
              </View>
              <Text style={styles.reason}>{COMPLAINT_REASON_LABELS[item.reason]}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>
              {item.createdAt ? (
                <Text style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString(getLocale() === 'en' ? 'en-US' : 'tr-TR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function statusStyle(status: string, Colors: ReturnType<typeof useThemeColors>) {
  if (status === 'APPROVED') return { color: Colors.success };
  if (status === 'REJECTED') return { color: Colors.error };
  return { color: Colors.warning };
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  lead: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  empty: { ...Typography.bodyMedium, color: Colors.textMuted },
  card: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetName: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700', flex: 1 },
  status: { ...Typography.caption, fontWeight: '700' },
  reason: { ...Typography.labelMedium, color: Colors.primary },
  description: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  date: { ...Typography.caption, color: Colors.textMuted },
  errorBox: {
    padding: Spacing[4],
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing[3],
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
}));
