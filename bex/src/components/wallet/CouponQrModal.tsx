import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import QRCode from 'react-native-qrcode-svg';
import { Coupon } from '@/types';
import {
  fetchCouponQrToken,
  hasRestAuthSession,
  isBackendCouponId,
} from '@/features/coupon/couponsApi';
import {
  encodeCouponQr,
  getCouponDisplayStatus,
  getCouponRemainingUses,
  COUPON_STATUS_LABELS,
} from '@/lib/couponUtils';
import { getCouponVisual } from '@/lib/couponVisuals';
import { formatDaysUntil, formatShortDate } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, Shadow, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const QR_SIZE = 240;
const QR_QUIET_ZONE = 12;
/** QR okuyucular için yüksek kontrast — tema rengi (#FAFAFA) kullanılmaz */
const QR_FOREGROUND = '#000000';
const QR_BACKGROUND = '#FFFFFF';

interface CouponQrModalProps {
  coupon: Coupon | null;
  businessName?: string;
  visible: boolean;
  onClose: () => void;
}

export function CouponQrModal({
  coupon,
  businessName,
  visible,
  onClose,
}: CouponQrModalProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const [restQrToken, setRestQrToken] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [useRestMode, setUseRestMode] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    setRestQrToken(null);
    setQrError(null);
    setQrLoading(false);
    setUseRestMode(false);
    if (!visible || !coupon) return;
    if (getCouponDisplayStatus(coupon) === 'locked') return;

    (async () => {
      const rest = (await hasRestAuthSession()) && isBackendCouponId(coupon.id);
      if (!rest) return;

      setUseRestMode(true);
      setQrLoading(true);
      try {
        const token = await fetchCouponQrToken(coupon.id);
        if (!cancelled) setRestQrToken(token);
      } catch {
        if (!cancelled) {
          setQrError(t('couponQrModal.qrFetchFailed'));
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, coupon]);

  const retryQr = async () => {
    if (!coupon || !isBackendCouponId(coupon.id)) return;
    setQrLoading(true);
    setQrError(null);
    try {
      const token = await fetchCouponQrToken(coupon.id);
      setRestQrToken(token);
    } catch {
      setQrError(t('couponQrModal.qrFetchFailed'));
    } finally {
      setQrLoading(false);
    }
  };

  if (!coupon) return null;

  const displayStatus = getCouponDisplayStatus(coupon);
  const isActive = displayStatus === 'active';
  const isLocked = displayStatus === 'locked';
  const canShowQr = isActive && !isLocked;
  const demoQrValue = encodeCouponQr(coupon);
  const qrValue = useRestMode ? restQrToken : demoQrValue;
  const remaining = getCouponRemainingUses(coupon);
  const visual = getCouponVisual(coupon.rewardDescription);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <Screen style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>{t('couponQrModal.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('couponQrModal.title')}</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, Shadow.card]}>
            <View style={[styles.stripe, { backgroundColor: visual.stripe }]} />
            <View style={styles.heroBody}>
              <View style={styles.heroTop}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>{visual.emoji}</Text>
                </View>
                <View style={styles.heroMeta}>
                  <Text style={styles.category}>{visual.label.toUpperCase()}</Text>
                  <Text style={styles.status}>{COUPON_STATUS_LABELS[displayStatus]}</Text>
                </View>
              </View>
              <Text style={styles.reward}>{coupon.rewardDescription}</Text>
              {businessName ? <Text style={styles.business}>{businessName}</Text> : null}
              {coupon.couponCode ? <Text style={styles.code}>{coupon.couponCode}</Text> : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {coupon.usedCount}/{coupon.totalUses}
              </Text>
              <Text style={styles.statLabel}>{t('couponQrModal.used')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{remaining}</Text>
              <Text style={styles.statLabel}>{t('couponQrModal.remaining')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, styles.statValueSmall]} numberOfLines={1}>
                {displayStatus === 'expired'
                  ? formatShortDate(coupon.expiresAt)
                  : formatDaysUntil(coupon.expiresAt)}
              </Text>
              <Text style={styles.statLabel}>{t('couponQrModal.validity')}</Text>
            </View>
          </View>

          {canShowQr ? (
            <View style={styles.qrSection}>
              <Text style={styles.qrTitle}>{t('couponQrModal.verificationCode')}</Text>
              {qrLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} />
              ) : qrError ? (
                <View style={styles.qrErrorBox}>
                  <Text style={styles.qrErrorText}>{qrError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={retryQr}>
                    <Text style={styles.retryText}>{t('couponQrModal.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ) : qrValue ? (
                <>
                  <View style={styles.qrWrap}>
                    <QRCode
                      value={qrValue}
                      size={QR_SIZE}
                      color={QR_FOREGROUND}
                      backgroundColor={QR_BACKGROUND}
                      quietZone={QR_QUIET_ZONE}
                      ecl="M"
                    />
                  </View>
                  <Text style={styles.hint}>
                    {t('couponQrModal.scanHint')}
                  </Text>
                </>
              ) : useRestMode ? (
                <Text style={styles.hint}>{t('couponQrModal.preparingQr')}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.qrMuted}>
              <Text style={styles.qrMutedText}>
                {isLocked
                  ? t('couponQrModal.lockedForSwap')
                  : displayStatus === 'pending'
                  ? t('couponQrModal.pendingActivation')
                  : displayStatus === 'exhausted'
                    ? t('couponQrModal.exhausted')
                    : displayStatus === 'traded'
                      ? t('couponQrModal.traded')
                      : t('couponQrModal.expired')}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.9}>
            <Text style={styles.doneText}>{t('couponQrModal.close')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    </Modal>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  close: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  heroCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  stripe: { width: 4 },
  heroBody: { flex: 1, padding: Spacing[5], gap: Spacing[2] },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 26, color: Colors.primary, fontWeight: '700' },
  heroMeta: { flex: 1, gap: 4 },
  category: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
  },
  status: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '700',
  },
  reward: { ...Typography.headingMedium, color: Colors.textPrimary, lineHeight: 28 },
  business: { ...Typography.bodyMedium, color: Colors.textSecondary },
  code: {
    ...Typography.labelLarge,
    color: Colors.primary,
    letterSpacing: 1,
    fontWeight: '800',
    marginTop: Spacing[1],
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing[4],
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginVertical: Spacing[1] },
  statValue: { ...Typography.headingMedium, color: Colors.textPrimary, fontSize: 18 },
  statValueSmall: { fontSize: 12, textAlign: 'center', paddingHorizontal: Spacing[1] },
  statLabel: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  qrSection: { alignItems: 'center', gap: Spacing[3], minHeight: 280 },
  qrTitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  qrWrap: {
    padding: Spacing[3],
    backgroundColor: QR_BACKGROUND,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    width: QR_SIZE + QR_QUIET_ZONE * 2 + Spacing[3] * 2,
    minHeight: QR_SIZE + QR_QUIET_ZONE * 2 + Spacing[3] * 2,
  },
  hint: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center' },
  qrErrorBox: { alignItems: 'center', gap: Spacing[3], padding: Spacing[4] },
  qrErrorText: { ...Typography.bodySmall, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
  },
  retryText: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '700' },
  qrMuted: {
    padding: Spacing[8],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  qrMutedText: { ...Typography.bodyMedium, color: Colors.textMuted, textAlign: 'center' },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    ...Shadow.primary,
  },
  doneText: {
    ...Typography.labelLarge,
    color: Colors.white,
    fontWeight: '700',
  },
}));
