import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CompletedTask, PortfolioItem } from '@/types';
import { CompletedTasksList, CompletedTasksStat } from '@/components/profile/CompletedTasksList';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { ProfileFeedbackList } from '@/components/profile/ProfileFeedbackList';
import { DangerBadge } from '@/components/profile/DangerBadge';
import { fetchProfileFeedback } from '@/features/feedback/feedbackApi';
import { PORTFOLIO_GALLERY_LIMIT } from '@/features/portfolio/profileLimits';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { openProtectedMediaUrl } from '@/lib/openProtectedMedia';

interface PublicProfileSectionsProps {
  profileId?: string;
  bio?: string;
  cvUrl?: string;
  completedCount: number;
  completedTasks: CompletedTask[];
  portfolio: PortfolioItem[];
  averageRating?: number;
  feedbackCount?: number;
  isDangerous?: boolean;
  approvedComplaintCount?: number;
  complaintRate?: number;
}

export function PublicProfileSections({
  profileId,
  bio,
  cvUrl,
  completedCount,
  completedTasks,
  portfolio,
  averageRating = 0,
  feedbackCount = 0,
  isDangerous = false,
  approvedComplaintCount = 0,
  complaintRate = 0,
}: PublicProfileSectionsProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [feedbackItems, setFeedbackItems] = useState<
    Awaited<ReturnType<typeof fetchProfileFeedback>>['recent']
  >([]);
  const [feedbackAvg, setFeedbackAvg] = useState(averageRating);
  const [feedbackTotal, setFeedbackTotal] = useState(feedbackCount);

  useEffect(() => {
    if (!profileId) return;
    fetchProfileFeedback(profileId, 5)
      .then((summary) => {
        setFeedbackItems(summary.recent);
        setFeedbackAvg(summary.averageStars || averageRating);
        setFeedbackTotal(summary.totalCount || feedbackCount);
      })
      .catch(() => {});
  }, [profileId, averageRating, feedbackCount]);

  return (
    <>
      {isDangerous ? (
        <View style={styles.dangerWrap}>
          <DangerBadge />
          <Text style={styles.dangerHint}>
            {t('publicProfile.dangerHint', {
              completed: completedCount,
              approved: approvedComplaintCount,
              rate: Math.round(complaintRate * 100),
            })}
          </Text>
        </View>
      ) : null}

      {bio?.trim() ? (
        <View style={styles.bioBox}>
          <Text style={styles.bioTitle}>{t('publicProfile.bioTitle')}</Text>
          <Text style={styles.bioText}>{bio.trim()}</Text>
        </View>
      ) : null}

      {cvUrl ? (
        <TouchableOpacity
          onPress={() => {
            void openProtectedMediaUrl(cvUrl).catch((err) => {
              Alert.alert(
                t('common.error'),
                err instanceof Error ? err.message : t('publicProfile.cvOpenFailed')
              );
            });
          }}
        >
          <Text style={styles.cvLink}>{t('publicProfile.viewCv')}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.statsRow}>
        <CompletedTasksStat
          count={completedCount}
          tasks={completedTasks}
          totalCount={completedCount}
        />
        <Text style={styles.statsDivider}>·</Text>
        <Text style={styles.statsMuted}>{t('publicProfile.approvedPhotos', { count: portfolio.length })}</Text>
        {feedbackTotal > 0 ? (
          <>
            <Text style={styles.statsDivider}>·</Text>
            <Text style={styles.statsMuted}>
              ⭐ {feedbackAvg.toFixed(1)} ({feedbackTotal})
            </Text>
          </>
        ) : null}
      </View>

      <CompletedTasksList tasks={completedTasks} totalCount={completedCount} />

      {profileId ? (
        <ProfileFeedbackList
          averageStars={feedbackAvg}
          totalCount={feedbackTotal}
          items={feedbackItems}
          title={t('publicProfile.feedbackTitle')}
        />
      ) : null}

      <UserPortfolioGallery
        items={portfolio}
        maxItems={PORTFOLIO_GALLERY_LIMIT}
        title={t('publicProfile.portfolioTitle')}
        subtitle={t('publicProfile.portfolioSubtitle')}
        emptyText={t('publicProfile.portfolioEmpty')}
      />
    </>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  dangerWrap: { alignItems: 'center', gap: Spacing[2] },
  dangerHint: { ...Typography.caption, color: Colors.error, textAlign: 'center' },
  bioBox: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[2],
  },
  bioTitle: { ...Typography.labelMedium, color: Colors.textPrimary },
  bioText: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  cvLink: { ...Typography.labelMedium, color: Colors.primary, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  statsDivider: { ...Typography.bodySmall, color: Colors.textMuted },
  statsMuted: { ...Typography.bodySmall, color: Colors.textMuted },
}));
