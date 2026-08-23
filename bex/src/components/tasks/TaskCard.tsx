import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Task, TaskDifficulty } from '../../types';
import { DIFFICULTY_LABELS, CATEGORY_LABELS } from '../../constants/taskLabels';
import { formatDeadline, getDifficultyColor } from '../../lib/taskUtils';
import { Typography, Radius, Spacing, Shadow, createThemedStyles } from '../../theme';
import { DangerBadge } from '../profile/DangerBadge';
import { ListingStarButton } from './ListingStarButton';
import { useTranslation } from '@/i18n';

export interface TaskCardProps {
  task: Task & { locationLabel?: string };
  businessName?: string;
  businessVerified?: boolean;
  businessIsDangerous?: boolean;
  compact?: boolean;
  onPress?: () => void;
  showSaveButton?: boolean;
}

export function TaskCard({
  task,
  businessName,
  businessVerified = false,
  businessIsDangerous = false,
  compact = false,
  onPress,
  showSaveButton = true,
}: TaskCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const diffColor = getDifficultyColor(task.difficulty);

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      {task.featured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>{t('taskCard.featured')}</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>
            {businessName?.charAt(0) ?? '?'}
          </Text>
        </View>
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName ?? t('taskCard.defaultBusiness')}
              {businessVerified ? ' ✓' : ''}
            </Text>
            {businessIsDangerous ? <DangerBadge compact /> : null}
          </View>
          <Text style={styles.category}>
            {CATEGORY_LABELS[task.category]}
            {task.locationLabel ? ` · ${task.locationLabel}` : ''}
          </Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
          <Text style={[styles.diffText, { color: diffColor }]}>
            {DIFFICULTY_LABELS[task.difficulty]}
          </Text>
        </View>
        {showSaveButton ? <ListingStarButton listingId={task.id} size={20} /> : null}
      </View>

      <Text style={styles.title} numberOfLines={compact ? 2 : 3}>
        {task.title}
      </Text>

      {!compact && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View style={styles.rewardBox}>
        <Text style={styles.rewardIcon}>🎁</Text>
        <Text style={styles.rewardText} numberOfLines={1}>
          {task.rewardDescription}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>⏱ {t('taskCard.hours', { count: task.estimatedHours })}</Text>
        <Text style={styles.meta}>👥 {task.currentApplicantCount}/{task.maxApplicants}</Text>
        <Text style={styles.deadline}>{formatDeadline(task.deadline)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles((Colors) => ({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[3],
    width: 280,
  },
  cardCompact: {
    width: '100%',
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  featuredText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flexShrink: 1,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  category: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  diffBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  diffText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  title: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  rewardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.primaryLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  rewardIcon: {
    fontSize: 16,
  },
  rewardText: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  meta: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  deadline: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: 'auto',
    fontWeight: '600',
  },
}));
