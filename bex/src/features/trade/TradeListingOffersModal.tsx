import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { confirmDialog } from '@/lib/confirmDialog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { tradeRepository } from './tradeRepository';
import { openSwapOfferChat } from './swapChatNavigation';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing, TradeOffer, TradeOfferStatus } from './types';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.88);

interface TradeListingOffersModalProps {
  visible: boolean;
  listing: TradeListing | null;
  ownerId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export function TradeListingOffersModal({
  visible,
  listing,
  ownerId,
  onClose,
  onUpdated,
}: TradeListingOffersModalProps) {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<TradeOfferStatus, string> = {
    pending: t('tradeListingOffersModal.statusPending'),
    accepted: t('tradeListingOffersModal.statusAccepted'),
    rejected: t('tradeListingOffersModal.statusRejected'),
    cancelled: t('tradeListingOffersModal.statusCancelled'),
  };
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [offers, setOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadOffers = useCallback(async () => {
    if (!listing) return;
    setLoading(true);
    const list = await tradeRepository.getOffersForListing(listing.id, ownerId);
    setOffers(list);
    setLoading(false);
  }, [listing, ownerId]);

  useEffect(() => {
    if (visible && listing) {
      loadOffers();
    } else {
      setOffers([]);
      setActingId(null);
    }
  }, [visible, listing, loadOffers]);

  const handleReject = async (offer: TradeOffer) => {
    setActingId(offer.id);
    try {
      await tradeRepository.rejectOffer(ownerId, offer.id);
      showToast(t('tradeListingOffersModal.rejectedToast'));
      await loadOffers();
      onUpdated();
    } catch (err) {
      showToast((err as Error).message || t('tradeListingOffersModal.rejectFailedToast'));
    } finally {
      setActingId(null);
    }
  };

  const handleAccept = async (offer: TradeOffer) => {
    const confirmed = await confirmDialog(
      t('tradeListingOffersModal.acceptTitle'),
      t('tradeListingOffersModal.acceptBody', {
        name: offer.fromUserName,
        coupon: offer.counterRewardLabel,
      }),
      t('tradeListingOffersModal.confirmAccept'),
      t('tradeListingOffersModal.dismiss')
    );
    if (!confirmed) return;

    setActingId(offer.id);
    try {
      await tradeRepository.acceptOffer(ownerId, offer.id);
      await loadOffers();
      onUpdated();
      showToast(t('tradeListingOffersModal.completedToast'));
    } catch (err) {
      showToast((err as Error).message || t('tradeListingOffersModal.tradeFailedToast'));
    } finally {
      setActingId(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" />

        <View
          style={[
            styles.sheet,
            {
              height: SHEET_HEIGHT,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View style={styles.handle} />

          <Text variant="headingSmall">{t('tradeListingOffersModal.header')}</Text>
          {listing ? (
            <Text variant="bodyMuted" marginTop="xs" marginBottom="md">
              {t('tradeListingOffersModal.subtitle', { title: listing.title, count: listing.offerCount })}
            </Text>
          ) : null}

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={tradeTheme.colors.tradePrimary} size="large" />
            </View>
          ) : offers.length === 0 ? (
            <View style={styles.centered}>
              <Text variant="bodyMuted">{t('tradeListingOffersModal.empty')}</Text>
            </View>
          ) : (
            <FlatList
              data={offers}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isPending = item.status === 'pending';
                const busy = actingId === item.id;

                return (
                  <Box
                    padding="md"
                    borderRadius="md"
                    marginBottom="sm"
                    borderWidth={1}
                    borderColor="border"
                    backgroundColor="background"
                  >
                    <Box flexDirection="row" justifyContent="space-between" marginBottom="xs">
                      <Text variant="label">{item.fromUserName}</Text>
                      <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary }}>
                        {STATUS_LABEL[item.status]}
                      </Text>
                    </Box>
                      <Text variant="body" style={{ fontSize: 14, lineHeight: 20 }}>
                        {item.message || '—'}
                      </Text>
                      <Text variant="caption" marginTop="xs" style={{ color: tradeTheme.colors.tradePrimary }}>
                        {t('tradeListingOffersModal.offeredCoupon', { coupon: item.counterRewardLabel })}
                      </Text>
                    <Text variant="caption" marginTop="xs">
                      {item.createdAtLabel}
                    </Text>

                    {isPending && listing?.status === 'active' ? (
                      <Box marginTop="md" gap="sm">
                        <Button
                          title={t('tradeListingOffersModal.openChat')}
                          variant="outline"
                          size="sm"
                          onPress={() => {
                            onClose();
                            setTimeout(() => openSwapOfferChat(item, item.fromUserName), 0);
                          }}
                          disabled={!!actingId}
                        />
                        <Box flexDirection="row">
                          <Box flex={1} marginRight="sm">
                            <Button
                              title={t('tradeListingOffersModal.reject')}
                              variant="outline"
                              size="sm"
                              onPress={() => handleReject(item)}
                              loading={busy}
                              disabled={!!actingId}
                            />
                          </Box>
                          <Box flex={1}>
                            <Button
                              title={t('tradeListingOffersModal.accept')}
                              size="sm"
                              onPress={() => void handleAccept(item)}
                              loading={busy}
                              disabled={!!actingId}
                            />
                          </Box>
                        </Box>
                      </Box>
                    ) : item.status !== 'pending' ? (
                      <Box marginTop="md">
                        <Button
                          title={t('tradeListingOffersModal.viewChat')}
                          variant="outline"
                          size="sm"
                          onPress={() => openSwapOfferChat(item, item.fromUserName)}
                        />
                      </Box>
                    ) : null}
                  </Box>
                );
              }}
            />
          )}

          <Button title={t('tradeListingOffersModal.close')} variant="ghost" onPress={onClose} style={{ marginTop: 8 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    width: '100%',
    backgroundColor: tradeTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: tradeTheme.colors.border,
    paddingHorizontal: tradeTheme.spacing.lg,
    paddingTop: tradeTheme.spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: tradeTheme.colors.border,
    alignSelf: 'center',
    marginBottom: tradeTheme.spacing.md,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
