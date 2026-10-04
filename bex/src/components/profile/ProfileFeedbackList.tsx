import React from 'react';
import { View, Text } from 'react-native';
import { FeedbackDto } from '@/features/feedback/feedbackApi';
import { StarRatingDisplay } from '@/components/profile/StarRating';
import { formatShortDate } from '@/lib/dateUtils';
import { Timestamp } from 'firebase/firestore';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface ProfileFeedbackListProps {
  averageStars: number;
  totalCount: number;
  items: FeedbackDto[];
  title?: string;
  embedded?: boolean;
}

export function ProfileFeedbackList({
  averageStars,
  totalCount,
  items,
  title,
  embedded = false,
}: ProfileFeedbackListProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  if (totalCount === 0 && items.length === 0) return null;

  return (
    <View style={[styles.wrap, embedded && styles.embedded]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title ?? t('profileFeedbackList.defaultTitle')}</Text>
        <StarRatingDisplay value={averageStars} />
        <Text style={styles.meta}>{t('profileFeedbackList.reviewCount', { count: totalCount })}</Text>
      </View>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.stars}>{'★'.repeat(item.stars)}{'☆'.repeat(5 - item.stars)}</Text>
          <Text style={styles.author}>{item.authorDisplayName}</Text>
          {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
          {item.createdAt ? (
            <Text style={styles.date}>
              {formatShortDate(Timestamp.fromDate(new Date(item.createdAt)))}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[3],
  },
  header: { gap: Spacing[1], alignItems: 'flex-start' },
  title: { ...Typography.labelLarge, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textMuted },
  row: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing[3],
    gap: 4,
  },
  stars: { color: Colors.warning, fontSize: 14 },
  author: { ...Typography.labelMedium, color: Colors.textPrimary },
  comment: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  date: { ...Typography.caption, color: Colors.textMuted },
  embedded: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
}));
