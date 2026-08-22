import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { adminRepository } from '@/features/admin';
import { fetchPendingComplaintsAdmin } from '@/features/complaint/complaintsApi';
import { fetchPendingSubscriptionUpgrades } from '@/features/admin/adminSubscriptionsApi';
import { authService } from '@/features/auth/authService';
import { shouldUseDemoData } from '@/lib/devMode';
import { Button } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function AdminPanelScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { bexUser, signOut } = useAuthStore();
  const { showToast } = useToast();
  const [pendingTasks, setPendingTasks] = useState(0);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [pendingComplaints, setPendingComplaints] = useState(0);
  const [pendingSubscriptions, setPendingSubscriptions] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    const [tasks, verifications, submissions, complaints, subscriptions] = await Promise.all([
      adminRepository.getPendingTasks(),
      adminRepository.getPendingVerifications(),
      adminRepository.getPendingSubmissions(),
      fetchPendingComplaintsAdmin().catch(() => []),
      fetchPendingSubscriptionUpgrades().catch(() => []),
    ]);
    setPendingTasks(tasks.length);
    setPendingKyc(verifications.length);
    setPendingSubmissions(submissions.length);
    setPendingComplaints(complaints.length);
    setPendingSubscriptions(subscriptions.length);
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

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const handleSeedCatalog = async () => {
    if (shouldUseDemoData()) {
      showToast(t('adminPanelScreen.demoAlreadyLoaded'));
      return;
    }

    setSeeding(true);
    try {
      const result = await adminRepository.seedLiveCatalog();
      showToast(t('adminPanelScreen.seedSuccess', { businesses: result.businesses, tasks: result.tasks }));
    } catch (err: unknown) {
      const code = (err as Error)?.message;
      if (code === 'already-seeded') {
        showToast(t('adminPanelScreen.alreadySeeded'));
      } else {
        showToast(t('adminPanelScreen.seedFailed'));
      }
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Screen style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('adminPanelScreen.greeting')}</Text>
            <Text style={styles.name}>{bexUser?.displayName ?? t('adminPanelScreen.defaultName')}</Text>
          </View>
          <Button title={t('adminPanelScreen.logout')} variant="outline" size="sm" fullWidth={false} onPress={handleLogout} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>{t('adminPanelScreen.statPendingTasks')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingSubmissions}</Text>
            <Text style={styles.statLabel}>{t('adminPanelScreen.statPendingSubmissions')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingKyc}</Text>
            <Text style={styles.statLabel}>{t('adminPanelScreen.statPendingKyc')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingComplaints}</Text>
            <Text style={styles.statLabel}>{t('adminPanelScreen.statPendingComplaints')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingSubscriptions}</Text>
            <Text style={styles.statLabel}>{t('adminPanelScreen.statPendingSubscriptions')}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title={t('adminPanelScreen.actionTaskModeration')}
            onPress={() => router.push('/(admin)/tasks' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionSubmissionModeration')}
            variant="secondary"
            onPress={() => router.push('/(admin)/submissions' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionBusinessVerification')}
            variant="outline"
            onPress={() => router.push('/(admin)/verifications' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionComplaintModeration')}
            variant="outline"
            onPress={() => router.push('/(admin)/complaints' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionSubscriptionPayments')}
            variant="outline"
            onPress={() => router.push('/(admin)/subscriptions' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionUserManagement')}
            variant="outline"
            onPress={() => router.push('/(admin)/users' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionNotifications')}
            variant="outline"
            onPress={() => router.push('/(admin)/notifications' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionAccountSettings')}
            variant="ghost"
            onPress={() => router.push('/settings' as Href)}
          />
          <Button
            title={t('adminPanelScreen.actionSeedLiveDemo')}
            variant="outline"
            onPress={handleSeedCatalog}
            loading={seeding}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>{t('adminPanelScreen.noteTitle')}</Text>
          <Text style={styles.noteText}>
            {t('adminPanelScreen.noteText')}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  greeting: { ...Typography.bodyMedium, color: Colors.textSecondary },
  name: { ...Typography.headingLarge, color: Colors.textPrimary, marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[6] },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statValue: { ...Typography.displayMedium, color: Colors.primary },
  statLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  actions: { gap: Spacing[3], marginBottom: Spacing[6] },
  note: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  noteTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  noteText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
}));
