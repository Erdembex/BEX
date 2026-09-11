import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { EnrichedTask } from '@/features/data/businessesRepository';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { ListingStarButton } from '@/components/tasks/ListingStarButton';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { BRAND_NAVY, brandNavyAlpha } from '@/theme/brand';
import { useTranslation } from '@/i18n';

const CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.72, 300);
const CARD_HEIGHT = 340;

type Props = {
  task: EnrichedTask;
  onPress: () => void;
};

export function HomeTaskCarouselCard({ task, onPress }: Props) {
  const Colors = useThemeColors();
  const { t } = useTranslation();

  const rating = task.businessAverageRating ?? 0;
  const reviewCount = task.businessFeedbackCount ?? 0;
  const hasReviews = reviewCount > 0;
  const initial = (task.businessName ?? '?').charAt(0).toUpperCase();

  const locationLabel = useMemo(() => {
    if (task.locationLabel?.trim()) return task.locationLabel;
    return t('userHome.locationUnknown');
  }, [task.locationLabel, t]);

  const imageFallback = (
    <View style={[styles.imageFallback, { backgroundColor: Colors.primaryLight }]}>
      <Text style={[styles.fallbackInitial, { color: Colors.primaryDark }]}>{initial}</Text>
    </View>
  );

  return (
    <TouchableOpacity
      style={[styles.card, { shadowColor: BRAND_NAVY }]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={styles.imageArea}>
        {task.businessLogoUrl?.trim() ? (
          <AuthenticatedImage
            uri={task.businessLogoUrl}
            style={styles.heroImage}
            fallback={imageFallback}
          />
        ) : (
          imageFallback
        )}
        <LinearGradient
          colors={['transparent', brandNavyAlpha(0.15), brandNavyAlpha(0.55)]}
          style={styles.imageGradient}
        />

        <View style={styles.topRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={13} color={Colors.primary} />
            <Text style={styles.ratingText}>
              {hasReviews ? rating.toFixed(1) : '—'}
            </Text>
          </View>
          <ListingStarButton listingId={task.id} size={20} />
        </View>
      </View>

      <LinearGradient colors={[BRAND_NAVY, brandNavyAlpha(0.92)]} style={styles.infoArea}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="rgba(240,238,233,0.85)" />
          <Text style={styles.location} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>
        {task.businessName ? (
          <Text style={styles.businessName} numberOfLines={1}>
            {task.businessName}
            {task.businessVerified ? ' ✓' : ''}
          </Text>
        ) : null}
        {task.rewardDescription ? (
          <Text style={styles.reward} numberOfLines={1}>
            🎁 {task.rewardDescription}
          </Text>
        ) : null}
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>{t('userHome.viewTask')}</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export const HOME_TASK_CARD_WIDTH = CARD_WIDTH + Spacing[3];

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: Radius.xl + 4,
    overflow: 'hidden',
    backgroundColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  imageArea: {
    height: CARD_HEIGHT * 0.52,
    overflow: 'hidden',
    backgroundColor: '#E8E4DA',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontSize: 56,
    fontWeight: '800',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    position: 'absolute',
    top: Spacing[3],
    left: Spacing[3],
    right: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  ratingText: {
    ...Typography.caption,
    fontWeight: '800',
    color: BRAND_NAVY,
  },
  infoArea: {
    flex: 1,
    padding: Spacing[4],
    gap: Spacing[1],
    justifyContent: 'flex-end',
  },
  title: {
    ...Typography.labelLarge,
    fontWeight: '800',
    color: '#F0EEE9',
    lineHeight: 22,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.85)',
    flex: 1,
    fontWeight: '600',
  },
  businessName: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.75)',
    fontWeight: '600',
    marginTop: 2,
  },
  reward: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.9)',
    fontWeight: '600',
    marginTop: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
    paddingTop: Spacing[2],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  cta: {
    ...Typography.labelMedium,
    fontWeight: '800',
    color: '#E7C663',
  },
});
