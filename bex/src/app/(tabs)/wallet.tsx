import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { couponsRepository, businessesRepository } from '@/features/data';
import { fetchRestCoupons, hasRestAuthSession } from '@/features/coupon/couponsApi';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { getCouponDisplayStatus, useCouponStatusLabels, isCouponExpiringSoon } from '@/lib/couponUtils';
import { useTranslation } from '@/i18n';
import { Coupon } from '@/types';
import { router, Href } from 'expo-router';
import { CouponCard, CouponQrModal } from '@/components/wallet';
import { WalletSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { userHubBackHeaderProps } from '@/lib/userHubNavigation';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

export default function WalletScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();
  const COUPON_STATUS_LABELS = useCouponStatusLabels();
  const { firebaseUser } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [businessNames, setBusinessNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser) return;

    setLoading(true);
    setLoadError(null);

    let list: Coupon[] = [];
    let usedRest = false;

    if (await hasRestAuthSession()) {
      try {
        list = await fetchRestCoupons();
        usedRest = true;
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : t('walletScreen.loadFailed'));
        list = [];
      }
    }

    if (!usedRest) {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(firebaseUser.uid);
      }
      list = await couponsRepository.getByUser(firebaseUser.uid);
    }

    setCoupons(list);

    const names: Record<string, string> = {};
    for (const c of list) {
      if (c.businessName) names[c.businessId] = c.businessName;
      if (!names[c.businessId]) {
        const biz = await businessesRepository.getById(c.businessId);
        names[c.businessId] = biz?.name ?? c.businessName ?? t('walletScreen.defaultBusiness');
      }
    }
    setBusinessNames(names);
    setLoading(false);
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const active = coupons.filter((c) => getCouponDisplayStatus(c) === 'active' || getCouponDisplayStatus(c) === 'pending');
  const locked = coupons.filter((c) => getCouponDisplayStatus(c) === 'locked');
  const used = coupons.filter((c) => getCouponDisplayStatus(c) === 'exhausted');
  const swapped = coupons.filter((c) => getCouponDisplayStatus(c) === 'traded');
  const expired = coupons.filter((c) => getCouponDisplayStatus(c) === 'expired');
  const expiringSoon = active.filter((c) => isCouponExpiringSoon(c));
  const historyCount = used.length + swapped.length + expired.length;

  if (loading) {
    return (
      <TabScreen style={styles.safe}>
        <AppHeader title={t('walletScreen.title')} {...userHubBackHeaderProps()} />
        <WalletSkeleton />
      </TabScreen>
    );
  }

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('walletScreen.title')} {...userHubBackHeaderProps()} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.subtitle}>
            {t('walletScreen.summary', { active: active.length, history: historyCount })}
            {expiringSoon.length > 0 ? t('walletScreen.expiringSuffix', { count: expiringSoon.length }) : ''}
          </Text>
        </View>

        {expiringSoon.length > 0 && (
          <View style={styles.expiringBanner}>
            <Text style={styles.expiringText}>
              {t('walletScreen.expiringBanner', { count: expiringSoon.length })}
            </Text>
          </View>
        )}

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{loadError}</Text>
            <Button title={t('walletScreen.retry')} variant="outline" onPress={load} />
          </View>
        ) : null}

        {coupons.length === 0 && !loadError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>▣</Text>
            <Text style={styles.emptyTitle}>{t('walletScreen.emptyTitle')}</Text>
            <Text style={styles.emptyText}>
              {t('walletScreen.emptyText')}
            </Text>
            <Button
              title={t('walletScreen.browseTasks')}
              onPress={() => router.push('/(tabs)/tasks' as Href)}
              style={{ marginTop: Spacing[5], alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.section}>{t('walletScreen.activeCoupons')}</Text>
                {active.map((coupon, index) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    businessName={businessNames[coupon.businessId]}
                    onPress={() => setSelectedCoupon(coupon)}
                    variant={index === 0 ? 'hero' : 'default'}
                    layout="stack"
                  />
                ))}
              </>
            )}

            {locked.length > 0 && (
              <>
                <Text style={styles.section}>{t('walletScreen.lockedCoupons')}</Text>
                <Text style={styles.lockedHint}>{t('walletScreen.lockedHint')}</Text>
                {locked.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={coupon}
                    businessName={businessNames[coupon.businessId]}
                    onPress={() => setSelectedCoupon(coupon)}
                  />
                ))}
              </>
            )}

            {historyCount > 0 && (
              <>
                <Text style={[styles.section, styles.sectionArchive]}>{t('walletScreen.history')}</Text>

                {used.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>{t('walletScreen.used')}</Text>
                    {used.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        businessName={businessNames[coupon.businessId]}
                        onPress={() => setSelectedCoupon(coupon)}
                      />
                    ))}
                  </>
                )}

                {swapped.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>{t('walletScreen.traded')}</Text>
                    {swapped.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        businessName={businessNames[coupon.businessId]}
                        onPress={() => setSelectedCoupon(coupon)}
                      />
                    ))}
                  </>
                )}

                {expired.length > 0 && (
                  <>
                    <Text style={styles.historyGroup}>
                      {COUPON_STATUS_LABELS.expired}
                    </Text>
                    {expired.map((coupon) => (
                      <CouponCard
                        key={coupon.id}
                        coupon={coupon}
                        businessName={businessNames[coupon.businessId]}
                        onPress={() => setSelectedCoupon(coupon)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      <CouponQrModal
        coupon={selectedCoupon}
        businessName={
          selectedCoupon ? businessNames[selectedCoupon.businessId] : undefined
        }
        visible={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
      />
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingTop: Spacing[2], flexGrow: 1 },
  header: {
    marginBottom: Spacing[4],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  expiringBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  expiringText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  section: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    fontWeight: '700',
  },
  sectionArchive: {
    marginTop: Spacing[5],
    color: Colors.textSecondary,
  },
  lockedHint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing[3],
    lineHeight: 20,
  },
  historyGroup: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing[2],
    marginTop: Spacing[1],
  },
  empty: { alignItems: 'center', paddingTop: Spacing[16] },
  emptyIcon: {
    fontSize: 40,
    color: Colors.primary,
    marginBottom: Spacing[3],
    fontWeight: '300',
  },
  emptyTitle: { ...Typography.headingMedium, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBox: {
    padding: Spacing[4],
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorText: { ...Typography.bodySmall, color: Colors.error, lineHeight: 20 },
}));
