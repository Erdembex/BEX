import React, { useState } from 'react';
import { FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { TradeListing } from './types';
import { TradeCreateListingModal } from './TradeCreateListingModal';
import { TradeListingOffersModal } from './TradeListingOffersModal';
import { tradeRepository } from './tradeRepository';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

interface TradeMyListingsPanelProps {
  ownerId: string;
  listings: TradeListing[];
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
}

export function TradeMyListingsPanel({
  ownerId,
  listings,
  onRefresh,
  refreshing = false,
}: TradeMyListingsPanelProps) {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<TradeListing['status'], string> = {
    active: t('tradeMyListingsPanel.statusActive'),
    paused: t('tradeMyListingsPanel.statusPaused'),
    completed: t('tradeMyListingsPanel.statusCompleted'),
  };
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = (listing: TradeListing) => {
    Alert.alert(
      t('tradeMyListingsPanel.cancelTitle'),
      t('tradeMyListingsPanel.cancelBody'),
      [
        { text: t('tradeMyListingsPanel.dismiss'), style: 'cancel' },
        {
          text: t('tradeMyListingsPanel.confirmCancel'),
          style: 'destructive',
          onPress: async () => {
            setCancellingId(listing.id);
            try {
              await tradeRepository.cancelListing(ownerId, listing.id);
              await onRefresh();
            } catch (err) {
              Alert.alert(
                t('tradeMyListingsPanel.errorTitle'),
                err instanceof Error ? err.message : t('tradeMyListingsPanel.cancelFailed')
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Box flex={1}>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: tradeTheme.spacing.lg,
          paddingBottom: tradeTheme.spacing['2xl'],
          flexGrow: listings.length === 0 ? 1 : undefined,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tradeTheme.colors.tradePrimary}
          />
        }
        ListHeaderComponent={
          <Box paddingBottom="md">
            <Button title={t('tradeMyListingsPanel.createListing')} onPress={() => setCreateVisible(true)} />
          </Box>
        }
        ListEmptyComponent={
          <Box paddingTop="xl" alignItems="center">
            <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
              {t('tradeMyListingsPanel.empty')}
            </Text>
          </Box>
        }
        renderItem={({ item }) => (
          <Box
            backgroundColor="surface"
            borderRadius="lg"
            padding="md"
            marginBottom="md"
            borderWidth={1}
            borderColor="border"
          >
            <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1} marginRight="sm">
                <Text variant="headingSmall" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text variant="caption" marginTop="xs">
                  {item.rewardLabel} · {item.createdAtLabel}
                </Text>
              </Box>
              <Box
                paddingHorizontal="sm"
                paddingVertical="xs"
                borderRadius="full"
                borderWidth={1}
                borderColor="tradePrimaryBorder"
                backgroundColor="tradePrimaryLight"
              >
                <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary }}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </Box>
            </Box>

            <Text variant="bodyMuted" marginTop="sm" numberOfLines={3}>
              {item.description}
            </Text>

            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginTop="md"
              paddingTop="md"
              borderTopWidth={1}
              borderTopColor="border"
            >
              <Text variant="caption">
                {item.offerCount > 0 ? t('tradeMyListingsPanel.offerCount', { count: item.offerCount }) : t('tradeMyListingsPanel.noOffersYet')}
              </Text>
              {item.status === 'active' ? (
                <Box flexDirection="row" gap="sm">
                  <TouchableOpacity activeOpacity={0.82} onPress={() => setSelectedListing(item)}>
                    <Box
                      backgroundColor="tradeCta"
                      paddingHorizontal="md"
                      paddingVertical="sm"
                      borderRadius="md"
                    >
                      <Text variant="buttonPrimary" style={{ color: tradeTheme.colors.tradeCtaText }}>
                        {t('tradeMyListingsPanel.viewOffers')}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={() => handleCancel(item)}
                    disabled={cancellingId === item.id}
                  >
                    <Box
                      paddingHorizontal="md"
                      paddingVertical="sm"
                      borderRadius="md"
                      borderWidth={1}
                      borderColor="border"
                    >
                      <Text variant="caption">
                        {cancellingId === item.id ? t('tradeMyListingsPanel.cancelling') : t('tradeMyListingsPanel.cancel')}
                      </Text>
                    </Box>
                  </TouchableOpacity>
                </Box>
              ) : null}
            </Box>
          </Box>
        )}
      />

      <TradeCreateListingModal
        visible={createVisible}
        ownerId={ownerId}
        onClose={() => setCreateVisible(false)}
        onCreated={onRefresh}
      />

      <TradeListingOffersModal
        visible={selectedListing !== null}
        listing={selectedListing}
        ownerId={ownerId}
        onClose={() => setSelectedListing(null)}
        onUpdated={onRefresh}
      />
    </Box>
  );
}
