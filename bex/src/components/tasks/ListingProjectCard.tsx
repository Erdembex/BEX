import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskCategory } from '@/types';
import { EnrichedTask } from '@/features/data/businessesRepository';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { useCategoryLabels } from '@/constants/taskLabels';
import { ListingStarButton } from './ListingStarButton';

export type ListingProjectCardVariant = 'business' | 'user';

type ListingProjectCardProps = {
  task: Task | EnrichedTask;
  variant?: ListingProjectCardVariant;
  highlighted?: boolean;
  onPress?: () => void;
  showSaveButton?: boolean;
};

const CATEGORY_ICON: Record<TaskCategory, keyof typeof Ionicons.glyphMap> = {
  design: 'color-palette-outline',
  development: 'code-slash-outline',
  marketing: 'megaphone-outline',
  content: 'document-text-outline',
  photography: 'camera-outline',
  video: 'videocam-outline',
  translation: 'language-outline',
  consulting: 'people-outline',
  other: 'grid-outline',
};

function formatListingDate(date: Date, locale: string): string {
  try {
    return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getProgress(task: Task): number {
  if (task.maxApplicants <= 0) return 0;
  return Math.min(100, Math.round((task.currentApplicantCount / task.maxApplicants) * 100));
}

function isEnriched(task: Task | EnrichedTask): task is EnrichedTask {
  return 'businessName' in task && typeof (task as EnrichedTask).businessName === 'string';
}

export function ListingProjectCard({
  task,
  variant = 'user',
  highlighted = false,
  onPress,
  showSaveButton = variant === 'user',
}: ListingProjectCardProps) {
  const { t, locale } = useTranslation();
  const Colors = useThemeColors();
  const styles = useStyles();
  const CATEGORY_LABELS = useCategoryLabels();

  const createdAt = task.createdAt?.toDate?.() ?? new Date();
  const iconName = CATEGORY_ICON[task.category] ?? 'briefcase-outline';
  const progress = getProgress(task);

  const enriched = isEnriched(task) ? task : null;
  const businessName = enriched?.businessName;
  const businessVerified = enriched?.businessVerified ?? false;
  const rating = enriched?.businessAverageRating ?? 0;
  const reviewCount = enriched?.businessFeedbackCount ?? 0;
  const hasReviews = rating > 0 && reviewCount > 0;

  const palette = useMemo(() => {
    if (highlighted) {
      return {
        bg: BRAND_NAVY,
        title: BRAND_NAVY_TEXT,
        muted: 'rgba(240, 238, 233, 0.85)',
        accent: Colors.primary,
        track: 'rgba(255,255,255,0.22)',
        fill: Colors.primary,
        border: 'rgba(212, 184, 106, 0.35)',
      };
    }
    return {
      bg: Colors.card,
      title: Colors.textPrimary,
      muted: Colors.textSecondary,
      accent: Colors.secondary,
      track: Colors.borderLight,
      fill: Colors.primary,
      border: Colors.borderLight,
    };
  }, [Colors, highlighted]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      disabled={!onPress}
    >
      <View style={styles.cardTop}>
        <Text style={[styles.date, { color: palette.muted }]}>
          {formatListingDate(createdAt, locale)}
        </Text>
        {showSaveButton ? (
          <ListingStarButton listingId={task.id} size={18} />
        ) : (
          <Ionicons name="ellipsis-vertical" size={16} color={palette.muted} />
        )}
      </View>

      <View style={styles.titleRow}>
        <Ionicons name={iconName} size={18} color={palette.accent} />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: palette.title }]} numberOfLines={2}>
            {task.title}
          </Text>
          <Text style={[styles.category, { color: palette.muted }]} numberOfLines={1}>
            {CATEGORY_LABELS[task.category]}
          </Text>
        </View>
      </View>

      {variant === 'business' ? (
        <View style={styles.footerBlock}>
          <Text style={[styles.footerLabel, { color: palette.muted }]}>
            {t('businessDashboardScreen.progressLabel')}
          </Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: palette.track }]}>
              <View
                style={[styles.progressFill, { width: `${progress}%`, backgroundColor: palette.fill }]}
              />
            </View>
            <Text style={[styles.progressPct, { color: palette.title }]}>{progress}%</Text>
          </View>
        </View>
      ) : (
        <View style={styles.footerBlock}>
          {businessName ? (
            <View style={styles.businessRow}>
              <Text style={[styles.businessName, { color: palette.title }]} numberOfLines={1}>
                {businessName}
              </Text>
              {businessVerified ? (
                <Ionicons name="checkmark-circle" size={14} color={palette.accent} />
              ) : null}
            </View>
          ) : null}
          <View style={styles.ratingRow}>
            <Ionicons
              name="star"
              size={14}
              color={hasReviews ? Colors.primary : palette.muted}
            />
            <Text style={[styles.ratingText, { color: palette.muted }]}>
              {hasReviews
                ? t('tasksScreen.businessRating', {
                    rating: rating.toFixed(1),
                    count: reviewCount,
                  })
                : t('tasksScreen.noBusinessReviews')}
            </Text>
          </View>
          {task.rewardDescription ? (
            <Text style={[styles.rewardHint, { color: palette.muted }]} numberOfLines={1}>
              🎁 {task.rewardDescription}
            </Text>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles(() => ({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[3],
    minHeight: 172,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...Typography.caption,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-start',
    flex: 1,
  },
  titleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.labelLarge,
    fontWeight: '700',
    lineHeight: 20,
  },
  category: {
    ...Typography.caption,
  },
  footerBlock: {
    gap: Spacing[2],
    marginTop: 'auto',
  },
  footerLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  progressPct: {
    ...Typography.caption,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'right',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  businessName: {
    ...Typography.labelMedium,
    fontWeight: '700',
    flexShrink: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  ratingText: {
    ...Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  rewardHint: {
    ...Typography.caption,
  },
}));

/** @deprecated ListingProjectCard variant="business" kullan */
export function BusinessListingProjectCard(
  props: Omit<ListingProjectCardProps, 'variant'>
) {
  return <ListingProjectCard {...props} variant="business" showSaveButton={false} />;
}
