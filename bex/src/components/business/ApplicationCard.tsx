import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface ApplicationCardProps {
  application: Application;
  taskTitle: string;
  applicantName?: string;
  portfolioThumbs?: string[];
  onPress: () => void;
  onViewProfile?: () => void;
  onOpenChat?: () => void;
}

function useApplicationStatusColors(): Record<ApplicationStatus, string> {
  const Colors = useThemeColors();
  return {
    pending: Colors.warning,
    approved: Colors.info,
    rejected: Colors.error,
    submitted: Colors.primary,
    submission_approved: Colors.success,
    rewarded: Colors.success,
    cancelled: Colors.textTertiary,
  };
}

export function ApplicationCard({
  application,
  taskTitle,
  applicantName,
  portfolioThumbs = [],
  onPress,
  onViewProfile,
  onOpenChat,
}: ApplicationCardProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const statusColors = useApplicationStatusColors();
  const statusColor = statusColors[application.status];
  const thumbs = portfolioThumbs.slice(0, 3);
  const resolvedApplicantName = applicantName ?? t('applicationCard.defaultApplicant');

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {taskTitle}
          </Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {APPLICATION_STATUS_LABELS[application.status]}
            </Text>
          </View>
        </View>
        <Text style={styles.applicant}>{resolvedApplicantName}</Text>
        {thumbs.length > 0 ? (
          <View style={styles.thumbRow}>
            {thumbs.map((url, i) => (
              <AuthenticatedImage key={`${url}-${i}`} uri={url} style={styles.thumb} />
            ))}
            <Text style={styles.thumbHint}>
              {t('applicationCard.approvedWorkCount', { count: thumbs.length })}
            </Text>
          </View>
        ) : application.status === 'pending' ? (
          <Text style={styles.portfolioHint}>{t('applicationCard.portfolioHint')}</Text>
        ) : null}
        <Text style={styles.preview} numberOfLines={2}>
          {application.submissionText || application.coverLetter}
        </Text>
      </TouchableOpacity>
      {application.status === 'pending' ? (
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.quickBtn, styles.quickBtnDecision]} onPress={onPress}>
            <Text style={[styles.quickBtnText, styles.quickBtnTextDecision]}>
              {t('applicationCard.reviewApplication')}
            </Text>
          </TouchableOpacity>
          {onViewProfile ? (
            <TouchableOpacity style={styles.quickBtn} onPress={onViewProfile}>
              <Text style={styles.quickBtnText}>{t('applicationCard.viewProfile')}</Text>
            </TouchableOpacity>
          ) : null}
          {onOpenChat ? (
            <TouchableOpacity style={styles.quickBtn} onPress={onOpenChat}>
              <Text style={styles.quickBtnText}>{t('applicationCard.message')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  applicant: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  portfolioHint: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: Spacing[1],
    fontWeight: '600',
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
  },
  thumbHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  quickBtn: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  quickBtnPrimary: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  quickBtnDecision: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickBtnText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  quickBtnTextPrimary: {
    color: Colors.primaryDark,
  },
  quickBtnTextDecision: {
    color: Colors.textOnPrimary,
  },
}));
