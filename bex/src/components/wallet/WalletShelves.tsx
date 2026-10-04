import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Coupon } from '@/types';
import { getCouponDisplayStatus, useCouponStatusLabels } from '@/lib/couponUtils';
import { getCouponVisual } from '@/lib/couponVisuals';
import { useTranslation } from '@/i18n';
import {
  Typography,
  Spacing,
  Radius,
  createThemedStyles,
  useThemeColors,
  useIsDarkMode,
} from '@/theme';

const SCALLOPS = 10;
const DASHES = 16;

function Scallops({ color }: { color: string }) {
  const styles = useShelfStyles();
  return (
    <View style={styles.scallopRow} pointerEvents="none">
      {Array.from({ length: SCALLOPS }, (_, index) => (
        <View key={index} style={[styles.scallop, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

function GoldDash() {
  const Colors = useThemeColors();
  const styles = useShelfStyles();
  return (
    <View style={styles.dashRow}>
      {Array.from({ length: DASHES }, (_, index) => (
        <View key={index} style={[styles.dash, { backgroundColor: Colors.accent }]} />
      ))}
    </View>
  );
}

export function WalletReadyShelf({
  coupons,
  names,
  fallbackName,
  onPress,
}: {
  coupons: Coupon[];
  names: Record<string, string>;
  fallbackName: string;
  onPress: (coupon: Coupon) => void;
}) {
  const Colors = useThemeColors();
  const dark = useIsDarkMode();
  const styles = useShelfStyles();
  const { t } = useTranslation();
  const labels = useCouponStatusLabels();
  const shelfColor = dark ? Colors.moneyGreenDark : Colors.moneyGreen;
  const readyCount = coupons.filter((coupon) => getCouponDisplayStatus(coupon) === 'active').length;

  return (
    <View style={[styles.shelf, { backgroundColor: shelfColor }]}>
      <Text style={[styles.shelfTitle, { color: dark ? Colors.textPrimary : Colors.textOnPrimary }]}>
        {t('walletScreen.readyTitle')}
      </Text>
      {readyCount > 0 ? (
        <Text style={[styles.shelfHint, { color: dark ? Colors.textPrimary : Colors.textOnPrimary }]}>
          {t('walletScreen.readyHint', { count: readyCount })}
        </Text>
      ) : (
        <View style={styles.shelfHintSpacer} />
      )}
      {coupons.map((coupon) => {
        const status = getCouponDisplayStatus(coupon);
        const visual = getCouponVisual(coupon.rewardDescription);
        const canUse = status === 'active';
        return (
          <TouchableOpacity
            key={coupon.id}
            style={styles.ticket}
            onPress={() => onPress(coupon)}
            activeOpacity={0.92}
          >
            <Scallops color={shelfColor} />
            <Text style={styles.kind}>{visual.label.toUpperCase()}</Text>
            <Text style={styles.business} numberOfLines={1}>
              {names[coupon.businessId] || coupon.businessName || fallbackName}
            </Text>
            <Text style={styles.reward} numberOfLines={2}>
              {coupon.rewardDescription}
            </Text>
            <GoldDash />
            <View style={styles.ticketFoot}>
              <Text style={styles.code} numberOfLines={1}>
                {coupon.couponCode || t('couponCard.digitalCoupon')}
              </Text>
              <View style={[styles.useBtn, !canUse && styles.useBtnQuiet]}>
                <Text style={[styles.useBtnText, !canUse && styles.useBtnTextQuiet]}>
                  {canUse ? t('walletScreen.useCoupon') : labels[status]}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function WalletArchiveList({
  coupons,
  names,
  fallbackName,
  onPress,
}: {
  coupons: Coupon[];
  names: Record<string, string>;
  fallbackName: string;
  onPress: (coupon: Coupon) => void;
}) {
  const styles = useShelfStyles();
  const labels = useCouponStatusLabels();

  return (
    <View style={styles.archive}>
      {coupons.map((coupon, index) => {
        const visual = getCouponVisual(coupon.rewardDescription);
        const status = getCouponDisplayStatus(coupon);
        return (
          <TouchableOpacity
            key={coupon.id}
            style={[styles.row, index > 0 && styles.rowDivider]}
            onPress={() => onPress(coupon)}
            activeOpacity={0.86}
          >
            <View style={styles.rowTop}>
              <Text style={styles.rowKind}>{visual.label.toUpperCase()}</Text>
              <Text style={styles.rowBiz} numberOfLines={1}>
                {names[coupon.businessId] || coupon.businessName || fallbackName}
              </Text>
              <Text style={styles.rowStatus}>{labels[status]}</Text>
            </View>
            <Text style={styles.rowReward} numberOfLines={2}>
              {coupon.rewardDescription}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const useShelfStyles = createThemedStyles((Colors) => ({
  shelf: {
    borderRadius: Radius['2xl'],
    padding: Spacing[4],
    marginBottom: Spacing[5],
  },
  shelfTitle: {
    ...Typography.headingSmall,
  },
  shelfHint: {
    ...Typography.bodySmall,
    opacity: 0.82,
    marginTop: 2,
    marginBottom: Spacing[3],
  },
  shelfHintSpacer: {
    height: Spacing[3],
  },
  ticket: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[4],
    marginTop: Spacing[3],
    overflow: 'visible',
  },
  scallopRow: {
    position: 'absolute',
    top: -7,
    left: Spacing[3],
    right: Spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scallop: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  kind: {
    ...Typography.caption,
    color: Colors.moneyGreen,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  business: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reward: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
    marginTop: Spacing[2],
  },
  dashRow: {
    flexDirection: 'row',
    gap: 5,
    overflow: 'hidden',
    marginTop: Spacing[3],
    marginBottom: Spacing[3],
  },
  dash: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  ticketFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[3],
  },
  code: {
    ...Typography.bodySmall,
    color: Colors.moneyGreen,
    fontWeight: '700',
    flex: 1,
  },
  useBtn: {
    backgroundColor: Colors.moneyGreen,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  useBtnQuiet: {
    backgroundColor: Colors.surfaceSecondary,
  },
  useBtnText: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  useBtnTextQuiet: {
    color: Colors.textSecondary,
  },
  archive: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing[4],
  },
  row: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  rowKind: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  rowBiz: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    flex: 1,
  },
  rowStatus: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '600',
  },
  rowReward: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
  },
}));
