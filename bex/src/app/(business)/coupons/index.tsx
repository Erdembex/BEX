import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { useFocusEffect } from "expo-router/react-navigation";
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { couponsRepository } from '@/features/data';
import { Coupon } from '@/types';
import { parseCouponScan, getCouponDisplayStatus, useCouponStatusLabels } from '@/lib/couponUtils';
import {
  hasRestAuthSession,
  verifyCouponByToken,
  type CouponVerifyResult,
} from '@/features/coupon/couponsApi';
import {
  fetchIssuedCoupons,
  type BusinessIssuedCoupon,
} from '@/features/coupon/businessCouponsApi';
import { CouponQrScanner } from '@/components/business/CouponQrScanner';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

function formatDateTime(ts: BusinessIssuedCoupon['issuedAt']): string {
  if (!ts) return '-';
  try {
    return ts.toDate().toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default function CouponVerifyScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const COUPON_STATUS_LABELS = useCouponStatusLabels();
  const ISSUED_STATUS_LABELS: Record<BusinessIssuedCoupon['statusRaw'], string> = {
    DRAFT: t('couponVerifyScreen.statusDraft'),
    ACTIVE: t('couponVerifyScreen.statusActive'),
    USED: t('couponVerifyScreen.statusUsed'),
    EXPIRED: t('couponVerifyScreen.statusExpired'),
    SWAPPED: t('couponVerifyScreen.statusSwapped'),
  };
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [history, setHistory] = useState<BusinessIssuedCoupon[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!(await hasRestAuthSession())) return;
    setHistoryLoading(true);
    try {
      setHistory(await fetchIssuedCoupons());
    } catch {
      // sessizce yut; liste boş kalır
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  /** REST modu: QR = qrToken. verify çağrısı kuponu doğrular ve anında kullanıma işaretler. */
  const verifyViaRest = async (rawToken: string) => {
    const token = rawToken.trim();
    if (!token) return;
    try {
      const outcome = await verifyCouponByToken(token);
      const messages: Record<CouponVerifyResult, { title: string; body: string }> = {
        SUCCESS: {
          title: t('couponVerifyScreen.verifiedTitle'),
          body: t('couponVerifyScreen.verifiedBody', { reward: outcome.rewardDescription }),
        },
        ALREADY_USED: {
          title: t('couponVerifyScreen.alreadyUsedTitle'),
          body: t('couponVerifyScreen.alreadyUsedBody'),
        },
        EXPIRED: {
          title: t('couponVerifyScreen.expiredTitle'),
          body: t('couponVerifyScreen.expiredBody'),
        },
        LOCKED_FOR_SWAP: {
          title: t('couponVerifyScreen.lockedTitle'),
          body: t('couponVerifyScreen.lockedBody'),
        },
      };
      const msg = messages[outcome.result];
      Alert.alert(msg.title, msg.body);
      await loadHistory();
    } catch (err) {
      Alert.alert(t('couponVerifyScreen.verifyFailedTitle'), (err as Error).message || t('couponVerifyScreen.verifyFailedBody'));
    }
  };

  const resolveCoupon = async (raw: string) => {
    if (await hasRestAuthSession()) {
      await verifyViaRest(raw);
      return null;
    }

    const parsed = parseCouponScan(raw);
    if (!parsed) {
      Alert.alert(t('couponVerifyScreen.invalidCodeTitle'), t('couponVerifyScreen.invalidCodeBody'));
      return null;
    }

    let found: Coupon | null = null;
    if (parsed.couponId) {
      found = await couponsRepository.getById(parsed.couponId);
    } else if (parsed.couponCode) {
      found = await couponsRepository.getByCode(parsed.couponCode);
      if (found) setCode(found.couponCode);
    }

    if (!found) {
      Alert.alert(t('couponVerifyScreen.notFoundTitle'), t('couponVerifyScreen.notFoundBody'));
      return null;
    }

    if (found.businessId !== business?.id) {
      Alert.alert(t('couponVerifyScreen.warningTitle'), t('couponVerifyScreen.warningBody'));
      return null;
    }

    setCoupon(found);
    return found;
  };

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await resolveCoupon(code.trim());
    setLoading(false);
  };

  const handleScan = async (data: string) => {
    setLoading(true);
    await resolveCoupon(data);
    setLoading(false);
  };

  const handleRedeem = async () => {
    if (!coupon || !firebaseUser) return;
    setLoading(true);
    const updated = await couponsRepository.redeem(coupon.id, firebaseUser.uid);
    if (updated) {
      setCoupon(updated);
      Alert.alert(
        t('couponVerifyScreen.redeemedTitle'),
        t('couponVerifyScreen.redeemedBody', { remaining: updated.totalUses - updated.usedCount, total: updated.totalUses })
      );
    } else {
      Alert.alert(t('couponVerifyScreen.redeemErrorTitle'), t('couponVerifyScreen.redeemErrorBody'));
    }
    setLoading(false);
  };

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{t('couponVerifyScreen.title')}</Text>
        <Text style={styles.subtitle}>
          {t('couponVerifyScreen.subtitle')}
        </Text>

        <Button
          title={t('couponVerifyScreen.scanQr')}
          onPress={() => setScannerOpen(true)}
          style={{ marginBottom: Spacing[4] }}
        />

        <Input
          label={t('couponVerifyScreen.codeLabel')}
          value={code}
          onChangeText={setCode}
          placeholder={t('couponVerifyScreen.codePlaceholder')}
          autoCapitalize="characters"
        />

        <Button title={t('couponVerifyScreen.findCoupon')} onPress={handleLookup} loading={loading} variant="secondary" />

        {coupon && (
          <View style={styles.card}>
            <Text style={styles.cardCode}>{coupon.couponCode}</Text>
            <Text style={styles.reward}>{coupon.rewardDescription}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>{t('couponVerifyScreen.statusLabel')}</Text>
              <Text style={styles.value}>
                {COUPON_STATUS_LABELS[getCouponDisplayStatus(coupon)]}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t('couponVerifyScreen.usageLabel')}</Text>
              <Text style={styles.value}>
                {coupon.usedCount} / {coupon.totalUses}
              </Text>
            </View>
            {coupon.status === 'active' && coupon.usedCount < coupon.totalUses && (
              <Button
                title={t('couponVerifyScreen.confirmUsage')}
                onPress={handleRedeem}
                loading={loading}
                style={{ marginTop: Spacing[4] }}
              />
            )}
          </View>
        )}

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>{t('couponVerifyScreen.distributedCouponsTitle')}</Text>
          {historyLoading && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>
        <Text style={styles.historySubtitle}>
          {t('couponVerifyScreen.distributedCouponsSubtitle')}
        </Text>

        {!historyLoading && history.length === 0 && (
          <Text style={styles.emptyText}>{t('couponVerifyScreen.emptyHistory')}</Text>
        )}

        {history.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <View style={styles.historyRowMain}>
              <Text style={styles.historyReward} numberOfLines={1}>
                {item.rewardDescription}
              </Text>
              {item.recipientName && (
                <Text style={styles.historyRecipient} numberOfLines={1}>
                  {t('couponVerifyScreen.recipientLabel', { name: item.recipientName })}
                </Text>
              )}
              <Text style={styles.historyMeta}>
                {t('couponVerifyScreen.issuedLabel', { date: formatDateTime(item.issuedAt) })}
              </Text>
              {item.statusRaw === 'USED' && (
                <Text style={styles.historyUsed}>
                  {t('couponVerifyScreen.usedLabel', { date: formatDateTime(item.usedAt) })}
                </Text>
              )}
            </View>
            <View
              style={[
                styles.badge,
                item.statusRaw === 'USED' && styles.badgeUsed,
                item.statusRaw === 'EXPIRED' && styles.badgeExpired,
                item.statusRaw === 'SWAPPED' && styles.badgeSwapped,
              ]}
            >
              <Text style={styles.badgeText}>{ISSUED_STATUS_LABELS[item.statusRaw]}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <CouponQrScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[6] },
  card: {
    marginTop: Spacing[6],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardCode: {
    ...Typography.headingMedium,
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  reward: { ...Typography.bodyLarge, color: Colors.textPrimary, marginBottom: Spacing[4] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: { ...Typography.bodySmall, color: Colors.textTertiary },
  value: { ...Typography.labelMedium, color: Colors.textPrimary },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[8],
  },
  historyTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  historySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    marginBottom: Spacing[3],
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    paddingVertical: Spacing[4],
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  historyRowMain: { flex: 1, marginRight: Spacing[3] },
  historyReward: { ...Typography.labelLarge, color: Colors.textPrimary },
  historyRecipient: {
    ...Typography.bodySmall,
    color: Colors.primary,
    marginTop: Spacing[1],
  },
  historyMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing[1] },
  historyUsed: { ...Typography.bodySmall, color: Colors.success, marginTop: Spacing[1] },
  badge: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  badgeUsed: { backgroundColor: Colors.successLight },
  badgeExpired: { backgroundColor: Colors.borderLight },
  badgeSwapped: { backgroundColor: Colors.borderLight },
  badgeText: { ...Typography.labelSmall, color: Colors.textPrimary },
}));
