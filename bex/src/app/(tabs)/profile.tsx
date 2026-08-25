import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { usersRepository } from '@/features/data';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { PublicProfileSections } from '@/components/profile/PublicProfileSections';
import { AppHeader } from '@/components/navigation/AppHeader';
import { userHubBackHeaderProps } from '@/lib/userHubNavigation';
import { Button } from '@/components/ui';
import { CompletedTask, PortfolioItem } from '@/types';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function ProfileScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profileId, setProfileId] = useState<string | undefined>(undefined);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;

      authService.refreshProfile().then(async (user) => {
        if (!user) return;

        if (user.role === 'user') {
          try {
            const stats = await usersRepository.getMyPublicProfileStats();
            if (stats) {
              user = {
                ...user,
                displayName: stats.displayName || user.displayName,
                completedTaskCount: stats.completedTaskCount,
                averageRating: stats.averageRating,
                feedbackCount: stats.feedbackCount,
                portfolioItems: stats.portfolio,
              };
              setPortfolio(stats.portfolio);
              setProfileId(stats.profileId);
              setCompletedTasks(stats.completedTasks);
              setAverageRating(stats.averageRating);
              setFeedbackCount(stats.feedbackCount);
            } else {
              setPortfolio(await usersRepository.getPortfolio(firebaseUser.uid));
            }
          } catch {
            setPortfolio(user.portfolioItems ?? []);
          }
        } else {
          setPortfolio([]);
        }

        setBexUser(user);
      });
    }, [firebaseUser, setBexUser])
  );

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/login');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('profileScreen.title')} {...userHubBackHeaderProps()} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}>
        <AccountSettings
          bexUser={bexUser}
          onUserUpdated={setBexUser}
          showAdminLink
        />

        {bexUser?.role === 'user' ? (
          <View style={styles.fullWidth}>
            <PublicProfileSections
              profileId={profileId}
              completedCount={bexUser.completedTaskCount ?? 0}
              completedTasks={completedTasks}
              portfolio={portfolio}
              averageRating={averageRating}
              feedbackCount={feedbackCount}
            />
          </View>
        ) : null}

        <Button
          title={t('profileScreen.settings')}
          variant="primary"
          onPress={() => router.push('/settings' as Href)}
        />

        {__DEV__ ? (
          <Button
            title={t('profileScreen.releaseChecklist')}
            variant="outline"
            onPress={() => router.push('/setup-guide' as Href)}
          />
        ) : null}

        <Button title={t('profileScreen.logout')} variant="outline" onPress={handleLogout} />

        <View style={styles.meta}>
          <Text style={styles.metaText}>Passla v{appVersion}</Text>
          {__DEV__ && (
            <Text style={styles.metaText}>
              {isAuthEmulatorActive() ? t('profileScreen.emulatorDemo') : t('profileScreen.liveFirebase')}
            </Text>
          )}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    alignItems: 'center',
    gap: Spacing[4],
  },
  fullWidth: { width: '100%', gap: Spacing[4] },
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
}));
