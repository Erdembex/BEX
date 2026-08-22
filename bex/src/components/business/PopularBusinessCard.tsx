import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Business } from '@/types';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface PopularBusinessCardProps {
  business: Business;
  onPress: () => void;
}

export function PopularBusinessCard({ business, onPress }: PopularBusinessCardProps) {
  const Colors = useThemeColors();
  const styles = useStyles();
  const { t } = useTranslation();

  const rating = business.averageRating ?? 0;
  const reviewCount = business.feedbackCount ?? 0;
  const activeListings = business.activeListingCount ?? business.totalTasksPublished ?? 0;
  const hasReviews = reviewCount > 0 && rating > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.avatarRing}>
        <ProfileAvatar name={business.name} avatarUrl={business.logoUrl} size={72} />
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={2}>
          {business.name}
        </Text>
        {business.isVerified ? (
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={styles.verifiedIcon} />
        ) : null}
      </View>

      <View style={styles.statsBlock}>
        <View style={styles.statRow}>
          <Ionicons
            name="star"
            size={14}
            color={hasReviews ? Colors.accent : Colors.textTertiary}
          />
          <Text style={[styles.statText, hasReviews && styles.statTextHighlight]}>
            {hasReviews
              ? t('home.popularBusinessRating', {
                  rating: rating.toFixed(1),
                  count: reviewCount,
                })
              : t('home.popularBusinessNoReviews')}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Ionicons name="briefcase-outline" size={14} color={Colors.secondary} />
          <Text style={styles.statText}>
            {t('home.popularBusinessListings', { count: activeListings })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const useStyles = createThemedStyles((Colors) => ({
  card: {
    width: 156,
    minHeight: 196,
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.borderGold,
    backgroundColor: Colors.primaryLight,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
  },
  name: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    lineHeight: 22,
  },
  verifiedIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  statsBlock: {
    width: '100%',
    gap: Spacing[2],
    marginTop: 'auto',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  statTextHighlight: {
    color: Colors.textPrimary,
  },
}));
