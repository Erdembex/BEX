import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { Coupon } from '@/types';
import { tradeRepository } from './tradeRepository';
import { getTradeInputStyle, useTradeTheme, TradeTheme } from './tradeTheme';
import { CreateTradeListingInput } from './types';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

interface TradeCreateListingModalProps {
  visible: boolean;
  ownerId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function TradeCreateListingModal({
  visible,
  ownerId,
  onClose,
  onCreated,
}: TradeCreateListingModalProps) {
  const theme = useTradeTheme();
  const inputStyle = useMemo(() => getTradeInputStyle(theme), [theme]);
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedTrade, setSuggestedTrade] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;

    (async () => {
      if (shouldUseDemoData()) {
        demoStore.ensureSampleCouponForUser(ownerId);
      }
      const list = await tradeRepository.getAvailableTradeCoupons(ownerId);
      setCoupons(list);
      setSelectedCouponId(list[0]?.id ?? null);
    })();
  }, [visible, ownerId]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setSuggestedTrade('');
    setSelectedCouponId(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedCouponId) {
      showToast(t('tradeCreateListingModal.selectCouponError'));
      return;
    }

    const selected = coupons.find((coupon) => coupon.id === selectedCouponId);
    const input: CreateTradeListingInput = {
      title: title.trim() || selected?.rewardDescription || t('tradeCreateListingModal.defaultListingTitle'),
      description: description.trim() || selected?.rewardDescription || '',
      suggestedTrade: suggestedTrade.trim(),
      rewardLabel: selected?.rewardDescription || t('tradeCreateListingModal.defaultCoupon'),
      couponId: selectedCouponId,
    };

    if (input.suggestedTrade.length < 5) {
      showToast(t('tradeCreateListingModal.suggestedTradeMinError'));
      return;
    }

    setSubmitting(true);
    try {
      await tradeRepository.createListing(ownerId, input);
      showToast(t('tradeCreateListingModal.publishedToast'));
      reset();
      onCreated();
      onClose();
    } catch (err) {
      showToast((err as Error).message || t('tradeCreateListingModal.createFailedToast'));
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={(event) => event.stopPropagation()}>
            <Box
              backgroundColor="tradePanel"
              borderTopLeftRadius="xl"
              borderTopRightRadius="xl"
              padding="lg"
              paddingBottom="2xl"
              borderTopWidth={1}
              borderColor="border"
              maxHeight="90%"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <Box
                  width={40}
                  height={4}
                  borderRadius="full"
                  backgroundColor="tradeInputBorder"
                  alignSelf="center"
                  marginBottom="md"
                />

                <Text variant="headingSmall">{t('tradeCreateListingModal.title')}</Text>
                <Text variant="body" marginTop="xs" marginBottom="md" style={{ color: theme.colors.tradeMuted }}>
                  {t('tradeCreateListingModal.subtitle')}
                </Text>

                <Text variant="label" marginBottom="xs">
                  {t('tradeCreateListingModal.couponLabel')}
                </Text>
                {coupons.length === 0 ? (
                  <Text variant="bodyMuted" marginBottom="md">
                    {t('tradeCreateListingModal.noCouponText')}
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
                          padding="sm"
                          borderRadius="md"
                          marginBottom="sm"
                          borderWidth={selected ? 2 : 1}
                          borderColor={selected ? 'tradeCardSelectedBorder' : 'tradeInputBorder'}
                          backgroundColor={selected ? 'tradeCardSelected' : 'tradeCard'}
                        >
                          <Text variant="label">{coupon.rewardDescription}</Text>
                          <Text variant="caption" style={{ color: theme.colors.tradeMuted }}>
                            {t('tradeCreateListingModal.usesLeft', { count: coupon.totalUses - coupon.usedCount })}
                          </Text>
                        </Box>
                      </TouchableOpacity>
                    );
                  })
                )}

                <Text variant="label" marginTop="md" marginBottom="xs">
                  {t('tradeCreateListingModal.titleLabel')}
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t('tradeCreateListingModal.titlePlaceholder')}
                  placeholderTextColor="#7A8490"
                  style={inputStyle}
                />

                <Text variant="label" marginTop="md" marginBottom="xs">
                  {t('tradeCreateListingModal.descriptionLabel')}
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('tradeCreateListingModal.descriptionPlaceholder')}
                  placeholderTextColor="#7A8490"
                  multiline
                  style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
                />

                <Text variant="label" marginTop="md" marginBottom="xs">
                  {t('tradeCreateListingModal.suggestedTradeLabel')}
                </Text>
                <TextInput
                  value={suggestedTrade}
                  onChangeText={setSuggestedTrade}
                  placeholder={t('tradeCreateListingModal.suggestedTradePlaceholder')}
                  placeholderTextColor="#7A8490"
                  style={inputStyle}
                />

                <Button
                  title={submitting ? t('tradeCreateListingModal.publishing') : t('tradeCreateListingModal.publish')}
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={submitting || coupons.length === 0}
                  style={{
                    marginTop: 16,
                    marginBottom: 8,
                    backgroundColor: theme.colors.tradeCta,
                    borderColor: theme.colors.tradeCta,
                  }}
                  textStyle={{ color: theme.colors.tradeCtaText }}
                />
                <Button title={t('tradeCreateListingModal.cancel')} variant="outline" onPress={handleClose} />
              </ScrollView>
            </Box>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

