import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Linking, Alert, TouchableOpacity } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { useFocusEffect } from "expo-router/react-navigation";
import {
  cancelSubscriptionAtPeriodEnd,
  createSubscriptionCheckout,
  fetchBusinessSubscription,
  fetchSubscriptionInvoices,
  fetchSubscriptionPlans,
  BillingPeriod,
  SubscriptionInvoice,
  SubscriptionPlan,
  BusinessSubscription,
} from '@/features/subscription/subscriptionApi';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const PERIOD_MONTHS: Record<BillingPeriod, number> = {
  MONTHLY: 1,
  SEMIANNUAL: 6,
  YEARLY: 12,
};

const FEATURE_ORDER = [
  'MAX_ACTIVE_LISTINGS',
  'MAX_UNDER_REVIEW_PER_LISTING',
  'CAN_FEATURE_LISTING',
  'CAN_SEE_APPLICANT_CONTACTS',
  'SWAP_MARKET_ACCESS',
  'ANALYTICS_ACCESS',
  'PRIORITY_SUPPORT',
];

function priceForPeriod(plan: SubscriptionPlan, period: BillingPeriod): number {
  if (period === 'YEARLY') return plan.priceYearly;
  if (period === 'SEMIANNUAL') return plan.priceSemiAnnual;
  return plan.priceMonthly;
}

function discountPercent(plan: SubscriptionPlan, period: BillingPeriod): number | null {
  if (period === 'MONTHLY') return null;
  const months = PERIOD_MONTHS[period];
  const total = priceForPeriod(plan, period);
  const fullPrice = plan.priceMonthly * months;
  if (fullPrice <= 0 || total <= 0) return null;
  const pct = Math.round((1 - total / fullPrice) * 100);
  return pct > 0 ? pct : null;
}

function formatMoney(value: number): string {
  return value.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('tr-TR');
}

export default function BusinessSubscriptionScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();

  const PERIOD_OPTIONS: { key: BillingPeriod; label: string }[] = [
    { key: 'MONTHLY', label: t('subscriptionScreen.periodMonthly') },
    { key: 'SEMIANNUAL', label: t('subscriptionScreen.periodSemiAnnual') },
    { key: 'YEARLY', label: t('subscriptionScreen.periodYearly') },
  ];

  const PERIOD_SUFFIX: Record<BillingPeriod, string> = {
    MONTHLY: t('subscriptionScreen.suffixMonthly'),
    SEMIANNUAL: t('subscriptionScreen.suffixSemiAnnual'),
    YEARLY: t('subscriptionScreen.suffixYearly'),
  };

  const FEATURE_LABELS: Record<string, string> = {
    MAX_ACTIVE_LISTINGS: t('subscriptionScreen.featureMaxActiveListings'),
    MAX_UNDER_REVIEW_PER_LISTING: t('subscriptionScreen.featureMaxUnderReview'),
    CAN_FEATURE_LISTING: t('subscriptionScreen.featureCanFeature'),
    CAN_SEE_APPLICANT_CONTACTS: t('subscriptionScreen.featureApplicantContacts'),
    SWAP_MARKET_ACCESS: t('subscriptionScreen.featureSwapMarket'),
    ANALYTICS_ACCESS: t('subscriptionScreen.featureAnalytics'),
    PRIORITY_SUPPORT: t('subscriptionScreen.featurePrioritySupport'),
  };

  const formatFeatureValue = (value: string): string => {
    if (value === 'true') return '✓';
    if (value === 'false') return '✕';
    if (value === 'unlimited') return t('subscriptionScreen.unlimited');
    return value;
  };

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: t('subscriptionScreen.statusActive'),
    TRIALING: t('subscriptionScreen.statusTrialing'),
    PAST_DUE: t('subscriptionScreen.statusPastDue'),
    CANCELLED: t('subscriptionScreen.statusCancelled'),
  };

  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [period, setPeriod] = useState<BillingPeriod>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionPlanId, setActionPlanId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [sub, planList, invoiceList] = await Promise.all([
        fetchBusinessSubscription(),
        fetchSubscriptionPlans(),
        fetchSubscriptionInvoices().catch(() => []),
      ]);
      setSubscription(sub);
      setPlans(planList);
      setInvoices(invoiceList);
    } catch (err) {
      Alert.alert(t('subscriptionScreen.errorTitle'), err instanceof Error ? err.message : t('subscriptionScreen.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

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

  const purchasablePlans = useMemo(
    () => plans.filter((p) => p.name !== 'FREE').sort((a, b) => a.priceMonthly - b.priceMonthly),
    [plans]
  );

  const hasPendingUpgrade = !!subscription?.pendingPlanName;

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setActionPlanId(plan.id);
    try {
      const result = await createSubscriptionCheckout(plan.id, period);
      if (result.requiresRedirect && result.redirectUrl) {
        await Linking.openURL(result.redirectUrl);
      } else {
        Alert.alert(t('subscriptionScreen.requestReceivedTitle'), result.message ?? t('subscriptionScreen.requestReceivedBody'));
      }
      await load();
    } catch (err) {
      Alert.alert(t('subscriptionScreen.errorTitle'), err instanceof Error ? err.message : t('subscriptionScreen.actionFailed'));
    } finally {
      setActionPlanId(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(t('subscriptionScreen.cancelTitle'), t('subscriptionScreen.cancelBody'), [
      { text: t('subscriptionScreen.dismiss'), style: 'cancel' },
      {
        text: t('subscriptionScreen.confirmCancel'),
        style: 'destructive',
        onPress: async () => {
          setActionPlanId('cancel');
          try {
            await cancelSubscriptionAtPeriodEnd();
            await load();
            Alert.alert(t('subscriptionScreen.okTitle'), t('subscriptionScreen.cancelScheduledText'));
          } catch (err) {
            Alert.alert(t('subscriptionScreen.errorTitle'), err instanceof Error ? err.message : t('subscriptionScreen.cancelFailedText'));
          } finally {
            setActionPlanId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <TabScreen style={styles.safe}>
        <AppHeader title={t('subscriptionScreen.headerTitle')} />
        <View style={styles.center}>
          <Text style={styles.muted}>{t('subscriptionScreen.loading')}</Text>
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('subscriptionScreen.headerTitle')} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {subscription ? (
          <View style={styles.currentCard}>
            <View style={styles.currentCardHeader}>
              <Text style={styles.planName}>{subscription.planDisplayName}</Text>
              <View
                style={[
                  styles.statusPill,
                  subscription.status === 'ACTIVE' && styles.statusPillActive,
                  subscription.status === 'PAST_DUE' && styles.statusPillWarning,
                  subscription.status === 'CANCELLED' && styles.statusPillMuted,
                ]}
              >
                <Text style={styles.statusPillText}>
                  {STATUS_LABELS[subscription.status] ?? subscription.status}
                </Text>
              </View>
            </View>
            {subscription.currentPeriodEnd ? (
              <Text style={styles.currentCardMeta}>
                {t('subscriptionScreen.periodEnd', { date: formatDate(subscription.currentPeriodEnd) })}
                {subscription.cancelAtPeriodEnd ? t('subscriptionScreen.cancelAtPeriodEndSuffix') : ''}
              </Text>
            ) : (
              <Text style={styles.currentCardMeta}>
                {t('subscriptionScreen.freePlanText')}
              </Text>
            )}
          </View>
        ) : null}

        {hasPendingUpgrade ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>
              {t('subscriptionScreen.pendingUpgradeTitle', { plan: subscription?.pendingPlanDisplayName ?? '' })}
            </Text>
            <Text style={styles.pendingText}>
              {t('subscriptionScreen.pendingUpgradeText')}
            </Text>
            {subscription?.pendingReference ? (
              <Text style={styles.pendingRef}>{t('subscriptionScreen.pendingRef', { ref: subscription.pendingReference })}</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>{t('subscriptionScreen.plansTitle')}</Text>

        <View style={styles.periodSelector}>
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.periodOption, active && styles.periodOptionActive]}
                onPress={() => setPeriod(opt.key)}
                activeOpacity={0.85}
              >
                <Text style={active ? styles.periodOptionTextActive : styles.periodOptionText}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {purchasablePlans.map((plan) => {
          const isCurrent = subscription?.planName === plan.name && subscription?.status !== 'CANCELLED';
          const price = priceForPeriod(plan, period);
          const discount = discountPercent(plan, period);
          const isRecommended = plan.name === 'PRO';

          return (
            <View
              key={plan.id}
              style={[styles.planCard, isRecommended && styles.planCardHighlighted]}
            >
              {isRecommended ? (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedBadgeText}>{t('subscriptionScreen.recommendedBadge')}</Text>
                </View>
              ) : null}

              <Text style={styles.planTitle}>{plan.displayName}</Text>

              <View style={styles.priceRow}>
                <Text style={styles.priceValue}>{formatMoney(price)} ₺</Text>
                <Text style={styles.priceSuffix}>/{PERIOD_SUFFIX[period]}</Text>
                {discount ? (
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>{t('subscriptionScreen.discountLabel', { percent: discount })}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.featureList}>
                {FEATURE_ORDER.filter((key) => plan.features[key] !== undefined).map((key) => (
                  <View key={key} style={styles.featureRow}>
                    <Text style={styles.featureLabel}>{FEATURE_LABELS[key]}</Text>
                    <Text style={styles.featureValue}>{formatFeatureValue(plan.features[key])}</Text>
                  </View>
                ))}
              </View>

              {isCurrent ? (
                <View style={styles.currentBadgeRow}>
                  <Text style={styles.currentBadge}>{t('subscriptionScreen.currentPlanBadge')}</Text>
                </View>
              ) : (
                <Button
                  title={hasPendingUpgrade ? t('subscriptionScreen.upgradeInProgress') : t('subscriptionScreen.upgradeTo', { plan: plan.displayName })}
                  variant={isRecommended ? 'primary' : 'outline'}
                  disabled={hasPendingUpgrade || actionPlanId !== null}
                  loading={actionPlanId === plan.id}
                  onPress={() => handleUpgrade(plan)}
                  style={{ marginTop: Spacing[3] }}
                />
              )}
            </View>
          );
        })}

        {subscription?.planName !== 'FREE' && !subscription?.cancelAtPeriodEnd ? (
          <Button
            title={t('subscriptionScreen.cancelAtPeriodEndButton')}
            variant="ghost"
            disabled={actionPlanId !== null}
            loading={actionPlanId === 'cancel'}
            onPress={handleCancel}
            style={{ marginTop: Spacing[2] }}
          />
        ) : null}

        {invoices.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('subscriptionScreen.invoicesTitle')}</Text>
            <View style={styles.invoiceCard}>
              {invoices.map((inv) => (
                <View key={inv.id} style={styles.invoiceRow}>
                  <Text style={styles.invoiceAmount}>
                    {formatMoney(inv.amount)} {inv.currency}
                  </Text>
                  <Text style={styles.invoiceMeta}>
                    {formatDate(inv.createdAt)} · {inv.status}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.footerNote}>
          {t('subscriptionScreen.footerNote')}
        </Text>

        <View style={styles.autoRenewCard}>
          <Text style={styles.autoRenewTitle}>{t('subscriptionScreen.autoRenewTitle')}</Text>
          <Text style={styles.autoRenewText}>{t('subscriptionScreen.autoRenewBody')}</Text>
          <Text style={styles.autoRenewText}>{t('subscriptionScreen.autoRenewCancel')}</Text>
          <Text style={styles.autoRenewText}>{t('subscriptionScreen.autoRenewManage')}</Text>
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { ...Typography.bodyMedium, color: Colors.textSecondary },
  currentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderGold,
  },
  currentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: { ...Typography.headingMedium, color: Colors.textPrimary },
  currentCardMeta: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing[2] },
  statusPill: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  statusPillActive: { backgroundColor: Colors.successLight },
  statusPillWarning: { backgroundColor: Colors.warningLight },
  statusPillMuted: { backgroundColor: Colors.surfaceSecondary },
  statusPillText: { ...Typography.caption, color: Colors.textPrimary, fontWeight: '700' },
  pendingCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pendingTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  pendingText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 19 },
  pendingRef: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing[2] },
  sectionTitle: { ...Typography.labelLarge, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing[1] },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.full,
    padding: 4,
    gap: 4,
  },
  periodOption: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  periodOptionActive: { backgroundColor: Colors.primary },
  periodOptionText: { ...Typography.labelMedium, color: Colors.textSecondary },
  periodOptionTextActive: { ...Typography.labelMedium, color: Colors.textOnPrimary, fontWeight: '700' },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  planCardHighlighted: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -1,
    right: Spacing[4],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[3],
    paddingVertical: 3,
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
  },
  recommendedBadgeText: { ...Typography.caption, color: Colors.textOnPrimary, fontWeight: '800', letterSpacing: 0.5 },
  planTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing[1], flexWrap: 'wrap' },
  priceValue: { ...Typography.displayMedium, color: Colors.primary, fontWeight: '800' },
  priceSuffix: { ...Typography.bodySmall, color: Colors.textMuted },
  discountPill: {
    backgroundColor: Colors.moneyGreenLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    marginLeft: Spacing[1],
  },
  discountPillText: { ...Typography.caption, color: Colors.moneyGreen, fontWeight: '700' },
  featureList: { marginTop: Spacing[2], gap: Spacing[1] },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureLabel: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, marginRight: Spacing[2] },
  featureValue: { ...Typography.labelMedium, color: Colors.textPrimary },
  currentBadgeRow: { marginTop: Spacing[3], alignItems: 'center' },
  currentBadge: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '700' },
  invoiceCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  invoiceAmount: { ...Typography.bodyMedium, color: Colors.textPrimary },
  invoiceMeta: { ...Typography.caption, color: Colors.textSecondary },
  footerNote: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: Spacing[2],
  },
  autoRenewCard: {
    marginTop: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  autoRenewTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  autoRenewText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
}));
