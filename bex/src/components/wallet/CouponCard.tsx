import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Coupon } from '@/types';
import {
  getCouponRemainingUses,
  getCouponDisplayStatus,
  isCouponExpiringSoon,
  COUPON_STATUS_LABELS,
} from '@/lib/couponUtils';
import { getCouponVisual } from '@/lib/couponVisuals';
import { formatDaysUntil, formatShortDate } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, Shadow, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface CouponCardProps {
  coupon: Coupon;
  businessName?: string;
  onPress: () => void;
  variant?: 'default' | 'hero';
  layout?: 'stack' | 'carousel';
  style?: ViewStyle;
}

function useCouponStatusColors(): Record<
  ReturnType<typeof getCouponDisplayStatus>,
  string
> {
  const Colors = useThemeColors();
  return {
    active: Colors.primary,
    pending: Colors.warning,
    locked: Colors.warning,
    exhausted: Colors.textMuted,
    expired: Colors.warning,
    traded: Colors.accent,
  };
}

export function CouponCard({
  coupon,
  businessName,
  onPress,
  variant = 'default',
  layout = 'stack',
  style,
}: CouponCardProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const displayStatus = getCouponDisplayStatus(coupon);
  const expiringSoon = isCouponExpiringSoon(coupon);
  const remaining = getCouponRemainingUses(coupon);
  const statusColors = useCouponStatusColors();
  const statusColor = expiringSoon ? Colors.warning : statusColors[displayStatus];
  const visual = getCouponVisual(coupon.rewardDescription);
  const isHero = variant === 'hero';
  const isCarousel = layout === 'carousel';
  const isActive = displayStatus === 'active';

  return (
    <TouchableOpacity
      style={[
        styles.wrapper,
        isHero && isCarousel && styles.wrapperCarousel,
        isHero && !isCarousel && styles.wrapperStackHero,
        !isActive && styles.wrapperMuted,
        Shadow.card,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      <View style={[styles.card, isHero && styles.cardHero]}>
        <View style={[styles.stripe, { backgroundColor: visual.stripe }]} />

        <View style={styles.content}>
          <View style={styles.topRow}>
            <View style={[styles.iconBox, isHero && styles.iconBoxHero]}>
              <Text style={[styles.iconText, isHero && styles.iconTextHero]}>
                {visual.emoji}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={styles.category}>{visual.label.toUpperCase()}</Text>
              {businessName ? (
                <Text style={styles.business} numberOfLines={1}>
                  {businessName}
                </Text>
              ) : null}
            </View>
            <View style={[styles.badge, { borderColor: statusColor + '55' }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>
                {expiringSoon ? t('couponCard.expiringSoon') : COUPON_STATUS_LABELS[displayStatus]}
              </Text>
            </View>
          </View>

          <Text style={[styles.reward, isHero && styles.rewardHero]} numberOfLines={2}>
            {coupon.rewardDescription}
          </Text>

          <View style={styles.footer}>
            {coupon.couponCode ? (
              <Text style={styles.code}>{coupon.couponCode}</Text>
            ) : (
              <Text style={styles.codeMuted}>{t('couponCard.digitalCoupon')}</Text>
            )}
            {isActive && (
              <Text style={styles.uses}>
                {t('couponCard.usesLeft', { remaining, total: coupon.totalUses })}
              </Text>
            )}
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.expiry}>
              {displayStatus === 'expired'
                ? t('couponCard.expired', { date: formatShortDate(coupon.expiresAt) })
                : formatDaysUntil(coupon.expiresAt)}
            </Text>
            {isActive && <Text style={styles.tapHint}>Detay →</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrapper: {
    marginBottom: Spacing[3],
  },
  wrapperCarousel: {
    width: 280,
    marginBottom: 0,
    marginRight: Spacing[4],
  },
  wrapperStackHero: {
    marginBottom: Spacing[4],
  },
  wrapperMuted: {
    opacity: 0.78,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardHero: {
    minHeight: 168,
  },
  stripe: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxHero: {
    width: 52,
    height: 52,
  },
  iconText: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  iconTextHero: {
    fontSize: 24,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  category: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 10,
  },
  business: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    backgroundColor: Colors.surface,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  reward: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    marginTop: Spacing[1],
  },
  rewardHero: {
    fontSize: 19,
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  code: {
    ...Typography.labelMedium,
    color: Colors.primary,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  codeMuted: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  uses: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[1],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  expiry: {
    ...Typography.caption,
    color: Colors.textMuted,
  },
  tapHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
}));
