import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { router, Href } from 'expo-router';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';
import { tradeRepository } from './tradeRepository';
import { swapChatHref } from './swapChatNavigation';
import { getTradeInputStyle, getTradeSheetStyle, useTradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing } from './types';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();
const SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.88);

interface TradeSubmitOfferModalProps {
  visible: boolean;
  listing: TradeListing | null;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export function TradeSubmitOfferModal({
  visible,
  listing,
  userId,
  onClose,
  onSubmitted,
}: TradeSubmitOfferModalProps) {
  const theme = useTradeTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const inputStyle = useMemo(() => getTradeInputStyle(theme), [theme]);
  const sheetStyle = useMemo(() => getTradeSheetStyle(theme), [theme]);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: { flex: 1, justifyContent: 'flex-end' },
        backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 999,
          backgroundColor: theme.colors.tradeInputBorder,
          alignSelf: 'center',
          marginBottom: theme.spacing.md,
        },
        infoBox: {
          backgroundColor: theme.colors.tradeInfoBg,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: theme.colors.tradeAccentBorder,
          padding: 12,
          marginBottom: 16,
        },
      }),
    [theme]
  );

  useEffect(() => {
    if (!visible || !userId) return;

    (async () => {
      setLoadingCoupons(true);
      try {
        if (shouldUseDemoData()) {
          demoStore.ensureSampleCouponForUser(userId);
        }
        const list = await tradeRepository.getAvailableTradeCoupons(userId);
        const filtered = listing ? list.filter((coupon) => coupon.id !== listing.couponId) : list;
        setCoupons(filtered);
        setSelectedCouponId(filtered[0]?.id ?? null);
      } finally {
        setLoadingCoupons(false);
      }
    })();
  }, [visible, userId, listing?.couponId]);

  const reset = () => {
    setNote('');
    setSelectedCouponId(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!listing || !selectedCouponId) {
      showToast(t('tradeSubmitOfferModal.selectCouponError'));
      return;
    }

    setSubmitting(true);
    try {
      const offerId = await tradeRepository.submitOffer(userId, listing.id, {
        counterCouponId: selectedCouponId,
        message: note.trim() || undefined,
      });
      showToast(t('tradeSubmitOfferModal.submittedToast'));
      reset();
      onSubmitted();
      onClose();
      if (offerId) {
        router.push(
          swapChatHref(offerId, {
            listingTitle: listing.title,
            peerName: listing.ownerName,
            status: 'pending',
          })
        );
      }
    } catch (err) {
      showToast((err as Error).message || t('tradeSubmitOfferModal.submitFailedToast'));
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View
          style={[
            sheetStyle,
            { height: SHEET_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} />
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text variant="headingSmall">{t('tradeSubmitOfferModal.title')}</Text>
            {listing ? (
              <>
                <Text variant="label" marginTop="sm" style={{ color: theme.colors.tradeHighlight }}>
                  {listing.title}
                </Text>
                <View style={styles.infoBox}>
                  <Text variant="body" style={{ color: theme.colors.tradeInfoText, lineHeight: 22 }}>
                    {t('tradeSubmitOfferModal.infoText')}
                  </Text>
                </View>
              </>
            ) : null}

            <Text variant="label" marginBottom="xs">
              {t('tradeSubmitOfferModal.myCouponsLabel')}
            </Text>
            {loadingCoupons ? (
              <Box alignItems="center" paddingVertical="lg">
                <ActivityIndicator color={theme.colors.tradeCta} />
              </Box>
            ) : coupons.length === 0 ? (
              <Text variant="body" marginBottom="md" style={{ color: theme.colors.tradeMuted }}>
                {t('tradeSubmitOfferModal.noCouponText')}
              </Text>
            ) : (
              coupons.map((coupon) => {
                const selected = selectedCouponId === coupon.id;
                return (
                  <TouchableOpacity
                    key={coupon.id}
                    activeOpacity={0.85}
                    onPress={() => setSelectedCouponId(coupon.id)}
                  >
                    <Box
                      padding="md"
                      borderRadius="md"
                      marginBottom="sm"
                      borderWidth={selected ? 2 : 1}
                      borderColor={selected ? 'tradeCardSelectedBorder' : 'tradeInputBorder'}
                      backgroundColor={selected ? 'tradeCardSelected' : 'tradeCard'}
                    >
                      <Text variant="label">{coupon.rewardDescription}</Text>
                      <Text variant="caption" style={{ color: theme.colors.tradeMuted }}>
                        {t('tradeSubmitOfferModal.usesAndNoShare', {
                          count: coupon.totalUses - coupon.usedCount,
                        })}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                );
              })
            )}

            <Text variant="label" marginTop="md" marginBottom="xs">
              {t('tradeSubmitOfferModal.noteLabel')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('tradeSubmitOfferModal.notePlaceholder')}
              placeholderTextColor="#7A8490"
              maxLength={200}
              style={[inputStyle, { marginBottom: 8 }]}
            />
          </ScrollView>

          <Button
            title={
              submitting ? t('tradeSubmitOfferModal.submitting') : t('tradeSubmitOfferModal.submit')
            }
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || loadingCoupons || coupons.length === 0}
            style={{
              marginTop: 8,
              marginBottom: 8,
              backgroundColor: theme.colors.tradeCta,
              borderColor: theme.colors.tradeCta,
            }}
            textStyle={{ color: theme.colors.tradeCtaText }}
          />
          <Button
            title={t('tradeSubmitOfferModal.cancel')}
            variant="outline"
            onPress={handleClose}
            textStyle={{ color: theme.colors.text }}
          />
        </View>
      </View>
    </Modal>
  );
}
