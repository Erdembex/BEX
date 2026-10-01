import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { usersRepository } from '@/features/data';
import { CompletedTask, PortfolioItem } from '@/types';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { PublicProfileSections } from '@/components/profile/PublicProfileSections';
import { BlockUserButton } from '@/components/user/BlockUserButton';
import { SendOfferSheet } from '@/components/messaging/SendOfferSheet';
import { SendChatOfferInput, sendConversationOffer } from '@/features/messages/offersApi';
import { openDirectConversation } from '@/features/messages/conversationsApi';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { getListingLimitInfo } from '@/lib/listingLimit';
import { useToast } from '@/components/common/Toast';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function PublicUserProfileByUsernameScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const role = useAuthStore((s) => s.bexUser?.role);
  const myUserId = useAuthStore((s) => s.firebaseUser?.uid);
  const { business } = useBusiness();
  const { username } = useLocalSearchParams<{ username: string }>();
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerSending, setOfferSending] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profileId, setProfileId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isDangerous, setIsDangerous] = useState(false);
  const [approvedComplaintCount, setApprovedComplaintCount] = useState(0);
  const [complaintRate, setComplaintRate] = useState(0);
  const [bio, setBio] = useState<string | undefined>();
  const [cvUrl, setCvUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    const stats = await usersRepository.getPublicProfileByUsername(String(username));
    if (stats) {
      setDisplayName(stats.displayName);
      setAvatarUrl(stats.avatarUrl);
      setCompletedCount(stats.completedTaskCount);
      setCompletedTasks(stats.completedTasks);
      setPortfolio(stats.portfolio);
      setProfileId(stats.profileId);
      setTargetUserId(stats.userId);
      setAverageRating(stats.averageRating);
      setFeedbackCount(stats.feedbackCount);
      setIsDangerous(stats.isDangerous);
      setApprovedComplaintCount(stats.approvedComplaintCount);
      setComplaintRate(stats.complaintRate);
      setBio(stats.bio);
      setCvUrl(stats.cvUrl);
    } else {
      setNotFound(true);
      setDisplayName('');
      setCompletedTasks([]);
      setPortfolio([]);
    }
    setLoading(false);
  }, [username]);

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

  if (notFound) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFoundTitle}>{t('userProfileScreen.notFoundTitle')}</Text>
          <Text style={styles.notFoundText}>{t('userProfileScreen.notFoundText', { username: String(username) })}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>{t('userProfileScreen.backLink')}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const canSendListing =
    role === 'business' && !!business?.id && !!targetUserId && targetUserId !== myUserId;

  const handleSendListing = async (input: SendChatOfferInput) => {
    if (!business?.id || !targetUserId) return;
    const limit = await getListingLimitInfo(business.id);
    if (!limit.canCreate) {
      throw new Error(t('userProfileScreen.sendListingNoRight'));
    }
    setOfferSending(true);
    try {
      const conversationId = await openDirectConversation(targetUserId);
      await sendConversationOffer(conversationId, input);
      showToast(t('userProfileScreen.sendListingDone'));
    } finally {
      setOfferSending(false);
    }
  };

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('userProfileScreen.back')}</Text>
          </TouchableOpacity>
          {canSendListing ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => setOfferOpen(true)}
              accessibilityRole="button"
            >
              <Text style={styles.sendBtnText}>{t('userProfileScreen.sendListing')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.hero}>
          <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size={72} />
          <Text style={styles.title}>{displayName}</Text>
          {targetUserId ? (
            <BlockUserButton targetUserId={targetUserId} displayName={displayName} variant="ghost" />
          ) : null}
        </View>

        <PublicProfileSections
          profileId={profileId}
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
      <SendOfferSheet
        visible={offerOpen}
        loading={offerSending}
        onClose={() => setOfferOpen(false)}
        onSubmit={handleSendListing}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[5] },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  sendBtnText: { ...Typography.labelMedium, color: Colors.textOnPrimary, fontWeight: '700' },
  hero: { alignItems: 'center', gap: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  notFoundTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  notFoundText: { ...Typography.bodyMedium, color: Colors.textMuted, marginBottom: Spacing[4] },
}));
