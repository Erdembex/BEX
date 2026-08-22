import React, { useCallback, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { usersRepository } from '@/features/data';
import { CompletedTask, PortfolioItem } from '@/types';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { PublicProfileSections } from '@/components/profile/PublicProfileSections';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function PublicUserProfileScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profileId, setProfileId] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isDangerous, setIsDangerous] = useState(false);
  const [approvedComplaintCount, setApprovedComplaintCount] = useState(0);
  const [complaintRate, setComplaintRate] = useState(0);
  const [bio, setBio] = useState<string | undefined>();
  const [cvUrl, setCvUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const stats = await usersRepository.getPublicProfileStats(id);
    if (stats) {
      setDisplayName(stats.displayName);
      setAvatarUrl(stats.avatarUrl);
      setCompletedCount(stats.completedTaskCount);
      setCompletedTasks(stats.completedTasks);
      setPortfolio(stats.portfolio);
      setProfileId(stats.profileId);
      setAverageRating(stats.averageRating);
      setFeedbackCount(stats.feedbackCount);
      setIsDangerous(stats.isDangerous);
      setApprovedComplaintCount(stats.approvedComplaintCount);
      setComplaintRate(stats.complaintRate);
      setBio(stats.bio);
      setCvUrl(stats.cvUrl);
    } else {
      setDisplayName(await usersRepository.getDisplayName(id));
      setCompletedCount(0);
      setCompletedTasks([]);
      setPortfolio(await usersRepository.getPortfolio(id));
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('userProfileScreen.back')}</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size={72} />
          <Text style={styles.title}>{displayName}</Text>
        </View>

        <PublicProfileSections
          profileId={profileId || String(id)}
          bio={bio}
          cvUrl={cvUrl}
          completedCount={completedCount}
          completedTasks={completedTasks}
          portfolio={portfolio}
          averageRating={averageRating}
          feedbackCount={feedbackCount}
          isDangerous={isDangerous}
          approvedComplaintCount={approvedComplaintCount}
          complaintRate={complaintRate}
        />
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  hero: { alignItems: 'center', gap: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
}));
