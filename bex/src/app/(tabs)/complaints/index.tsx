import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { AppHeader } from '@/components/navigation/AppHeader';
import { userHubBackHeaderProps } from '@/lib/userHubNavigation';
import { Button } from '@/components/ui';
import {
  useComplaintReasonLabels,
  fetchMyComplaints,
  fetchPublicComplaints,
  type ComplaintDto,
  type PublicComplaintDto,
} from '@/features/complaint/complaintsApi';
import { formatShortDate } from '@/lib/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function ComplaintBexScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();
  const COMPLAINT_REASON_LABELS = useComplaintReasonLabels();
  const [publicItems, setPublicItems] = useState<PublicComplaintDto[]>([]);
  const [myItems, setMyItems] = useState<ComplaintDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [pub, mine] = await Promise.all([
      fetchPublicComplaints().catch(() => []),
      fetchMyComplaints().catch(() => []),
    ]);
    setPublicItems(pub);
    setMyItems(mine);
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
    <TabScreen style={styles.safe}>
      <AppHeader title={t('complaintsScreen.title')} {...userHubBackHeaderProps()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <Text style={styles.lead}>
          {t('complaintsScreen.lead')}
        </Text>

        <Button
          title={t('complaintsScreen.reportBusiness')}
          onPress={() => router.push('/complaint/submit' as Href)}
        />

        <Text style={styles.sectionTitle}>{t('complaintsScreen.approvedComplaints', { count: publicItems.length })}</Text>
        {publicItems.length === 0 ? (
          <Text style={styles.empty}>{t('complaintsScreen.noApproved')}</Text>
        ) : (
          publicItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/business/${item.businessProfileId}` as Href)}
            >
              <View style={styles.tag}>
                <Text style={styles.tagText}>{t('complaintsScreen.tag')}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.businessName}</Text>
              <Text style={styles.cardMeta}>
                {COMPLAINT_REASON_LABELS[item.reason]} ·{' '}
                {item.approvedAt
                  ? formatShortDate(Timestamp.fromDate(new Date(item.approvedAt)))
                  : '—'}
              </Text>
              <Text style={styles.cardBody} numberOfLines={3}>
                {item.description}
              </Text>
            </TouchableOpacity>
          ))
        )}

        {myItems.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('complaintsScreen.myComplaints')}</Text>
            {myItems.map((item) => (
              <View key={item.id} style={styles.myCard}>
                <Text style={styles.cardTitle}>{item.businessName}</Text>
                <Text style={styles.cardMeta}>
                  {COMPLAINT_REASON_LABELS[item.reason]} · {item.status}
                </Text>
                <Text style={styles.cardBody} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4] },
  lead: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginTop: Spacing[2] },
  empty: { ...Typography.bodySmall, color: Colors.textMuted },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.error + '55',
    gap: Spacing[2],
  },
  myCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error + '18',
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tagText: { ...Typography.caption, color: Colors.error, fontWeight: '700' },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  cardMeta: { ...Typography.caption, color: Colors.textMuted },
  cardBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
}));
