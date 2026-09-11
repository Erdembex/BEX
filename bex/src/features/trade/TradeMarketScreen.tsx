import React, { useCallback, useState } from 'react';
import { FlatList, TouchableOpacity, ListRenderItem, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { Screen, useTabBarBottomPadding } from '@/components/common/Screen';
import { USER_TAB_BAR_HEIGHT } from '@/components/home/UserTabBar';
import { useFocusEffect } from "expo-router/react-navigation";
import { useLocalSearchParams } from 'expo-router';
import { createBox, ThemeProvider } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { tradeRepository } from './tradeRepository';
import { tradeTheme, TradeTheme, useTradeTheme } from './tradeTheme';
import { Spacing, useThemeColors } from '@/theme';
import { TradeListing, TradeOffer } from './types';
import { TradeMyOffersPanel } from './TradeMyOffersPanel';
import { TradeNewSwapPanel } from './TradeNewSwapPanel';
import { TradeHistoryPanel } from './TradeHistoryPanel';
import { TradeSubmitOfferModal } from './TradeSubmitOfferModal';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

type TradeTab = 'market' | 'new' | 'history' | 'offers';

interface TradeListingCardProps {
  item: TradeListing;
  currentUserId?: string;
  onOfferPress: (listing: TradeListing) => void;
}

function TradeListingCard({ item, currentUserId, onOfferPress }: TradeListingCardProps) {
  const { t } = useTranslation();
  const isOwnListing = currentUserId != null && item.ownerId === currentUserId;

  return (
    <Box
      backgroundColor="tradeCard"
      borderRadius="lg"
      padding="md"
      marginBottom="md"
      borderWidth={1}
      borderColor="tradeInputBorder"
    >
      <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1} marginRight="sm">
          <Text variant="headingSmall" numberOfLines={2}>
            {item.title}
          </Text>
          <Text variant="caption" marginTop="xs" style={{ color: tradeTheme.colors.tradeMuted }}>
            {item.rewardLabel} · {item.createdAtLabel}
          </Text>
        </Box>
        {item.offerCount > 0 ? (
          <Box
            backgroundColor="tradePrimaryLight"
            paddingHorizontal="sm"
            paddingVertical="xs"
            borderRadius="full"
            borderWidth={1}
            borderColor="tradePrimaryBorder"
          >
            <Text variant="caption" style={{ color: tradeTheme.colors.tradeHighlight }}>
              {t('tradeMarketScreen.offerCount', { count: item.offerCount })}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Text variant="body" marginTop="sm" numberOfLines={2} style={{ color: tradeTheme.colors.tradeMuted }}>
        {item.description}
      </Text>

      <Box
        marginTop="md"
        padding="sm"
        borderRadius="md"
        backgroundColor="tradeInfoBg"
        borderLeftWidth={3}
        borderLeftColor="tradeCta"
      >
        <Text
          variant="caption"
          marginBottom="xs"
          style={{ color: tradeTheme.colors.tradeHighlight, fontWeight: '700' }}
        >
          {t('tradeMarketScreen.suggestedTrade')}
        </Text>
        <Text variant="body" style={{ fontSize: 14, color: tradeTheme.colors.text }}>
          {item.suggestedTrade}
        </Text>
      </Box>

      <Box
        flexDirection="row"
        alignItems="center"
        marginTop="md"
        paddingTop="md"
        borderTopWidth={1}
        borderTopColor="border"
      >
        <Box
          width={40}
          height={40}
          borderRadius="md"
          backgroundColor="tradeCta"
          alignItems="center"
          justifyContent="center"
          marginRight="sm"
        >
          <Text variant="label" style={{ color: tradeTheme.colors.tradeCtaText }}>
            {item.ownerAvatarInitial}
          </Text>
        </Box>
        <Box flex={1}>
          <Text variant="caption" style={{ color: tradeTheme.colors.tradeMuted }}>
            {t('tradeMarketScreen.listingOwner')}
          </Text>
          <Text variant="label">{item.ownerName}</Text>
        </Box>
        {isOwnListing ? (
          <Text variant="caption" style={{ color: tradeTheme.colors.textMuted }}>
            {t('tradeMarketScreen.ownListing')}
          </Text>
        ) : (
          <TouchableOpacity activeOpacity={0.82} onPress={() => onOfferPress(item)}>
            <Box
              backgroundColor="tradeCta"
              paddingHorizontal="lg"
              paddingVertical="sm"
              borderRadius="md"
            >
              <Text variant="buttonPrimary" style={{ color: tradeTheme.colors.tradeCtaText }}>
                {t('tradeMarketScreen.makeOffer')}
              </Text>
            </Box>
          </TouchableOpacity>
        )}
      </Box>
    </Box>
  );
}

function TradeTabSwitch({
  active,
  onChange,
}: {
  active: TradeTab;
  onChange: (tab: TradeTab) => void;
}) {
  const { t } = useTranslation();
  const TAB_ITEMS: { id: TradeTab; label: string; short: string }[] = [
    { id: 'market', label: t('tradeMarketScreen.tabMarket'), short: t('tradeMarketScreen.tabMarketShort') },
    { id: 'new', label: t('tradeMarketScreen.tabNew'), short: t('tradeMarketScreen.tabNewShort') },
    { id: 'history', label: t('tradeMarketScreen.tabHistory'), short: t('tradeMarketScreen.tabHistoryShort') },
    { id: 'offers', label: t('tradeMarketScreen.tabOffers'), short: t('tradeMarketScreen.tabOffersShort') },
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: tradeTheme.spacing.md }}
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      {TAB_ITEMS.map((tab) => {
        const selected = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.85}
            onPress={() => onChange(tab.id)}
          >
            <Box
              paddingVertical="sm"
              paddingHorizontal="md"
              borderRadius="sm"
              alignItems="center"
              backgroundColor={selected ? 'tradeCta' : 'tradeCard'}
              borderWidth={1}
              borderColor={selected ? 'tradeCta' : 'tradeInputBorder'}
              minWidth={72}
            >
              <Text
                variant="caption"
                style={{
                  color: selected ? tradeTheme.colors.tradeCtaText : tradeTheme.colors.text,
                  fontWeight: '700',
                  fontSize: 11,
                }}
              >
                {tab.short}
              </Text>
            </Box>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export function TradeMarketScreen() {
  const tradeTheme = useTradeTheme();
  const Colors = useThemeColors();
  const tabBarPadding = useTabBarBottomPadding(24, USER_TAB_BAR_HEIGHT);
  const { t } = useTranslation();
  const { firebaseUser } = useAuthStore();
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<TradeTab>('market');
  const [listings, setListings] = useState<TradeListing[]>([]);
  const [myOffers, setMyOffers] = useState<TradeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadError(null);

      try {
        const market = await tradeRepository.getMarketListings();
        setListings(market);
        setLoadError(null);
      } catch (err) {
        const message = (err as Error).message || t('tradeMarketScreen.listingsLoadFailed');
        setListings([]);
        setLoadError(message);
        showToast(message);
      }

      if (!firebaseUser) {
        setMyOffers([]);
        return;
      }

      try {
        const sent = await tradeRepository.getMyOffers(firebaseUser.uid);
        setMyOffers(sent);
      } catch {
        setMyOffers([]);
      }
    } catch (err) {
      const message = (err as Error).message || t('tradeMarketScreen.dataLoadFailed');
      setLoadError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, showToast, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  React.useEffect(() => {
    if (
      tabParam === 'offers' ||
      tabParam === 'market' ||
      tabParam === 'new' ||
      tabParam === 'history'
    ) {
      setTab(tabParam);
    } else if (tabParam === 'mine') {
      setTab('new');
    }
  }, [tabParam]);

  React.useEffect(() => {
    if (firebaseUser && (tab === 'offers' || tab === 'history')) {
      load();
    }
  }, [tab, firebaseUser, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem: ListRenderItem<TradeListing> = ({ item }) => (
    <TradeListingCard
      item={item}
      currentUserId={firebaseUser?.uid}
      onOfferPress={(listing) => {
        if (!firebaseUser) {
          requireAuth(() => setSelectedListing(listing));
          return;
        }
        setSelectedListing(listing);
      }}
    />
  );

  return (
    <ThemeProvider theme={tradeTheme}>
      <Screen style={{ flex: 1, backgroundColor: tradeTheme.colors.background }}>
        <AppHeader title={t('tradeMarketScreen.headerTitle')} showMenu showNotifications />
        <Box flex={1} backgroundColor="background">
          <Box paddingHorizontal="lg" paddingTop="sm" paddingBottom="md">
            <Text variant="body" marginTop="xs" style={{ color: tradeTheme.colors.tradeMuted }}>
              {t('tradeMarketScreen.subtitle')}
            </Text>
            <TradeTabSwitch active={tab} onChange={setTab} />
            <Box
              flexDirection="row"
              marginTop="md"
              padding="sm"
              borderRadius="sm"
              backgroundColor="tradeInfoBg"
              borderWidth={1}
              borderColor="tradeAccentBorder"
            >
              <Text variant="body" style={{ color: tradeTheme.colors.tradeInfoText, lineHeight: 20, fontSize: 13 }}>
                {t('tradeMarketScreen.couponHint')}
              </Text>
            </Box>
          </Box>

          {loading ? (
            <Box flex={1} alignItems="center" justifyContent="center">
              <ActivityIndicator color={tradeTheme.colors.tradePrimary} size="large" />
              <Text variant="bodyMuted" marginTop="md">
                {t('tradeMarketScreen.loading')}
              </Text>
            </Box>
          ) : loadError ? (
            <Box flex={1} paddingHorizontal="lg" alignItems="center" justifyContent="center">
              <Text variant="bodyMuted" style={{ textAlign: 'center', marginBottom: 16 }}>
                {loadError}
              </Text>
              <Button
                title={t('tradeMarketScreen.retry')}
                variant="outline"
                onPress={() => {
                  setLoading(true);
                  load();
                }}
              />
            </Box>
          ) : tab === 'new' ? (
            firebaseUser ? (
              <TradeNewSwapPanel ownerId={firebaseUser.uid} onCreated={load} />
            ) : (
              <Box paddingHorizontal="lg">
                <Text variant="bodyMuted">{t('tradeMarketScreen.loginForNewTrade')}</Text>
              </Box>
            )
          ) : tab === 'history' ? (
            firebaseUser ? (
              <TradeHistoryPanel userId={firebaseUser.uid} />
            ) : (
              <Box paddingHorizontal="lg">
                <Text variant="bodyMuted">{t('tradeMarketScreen.loginForHistory')}</Text>
              </Box>
            )
          ) : tab === 'offers' ? (
            firebaseUser ? (
              <Box flex={1}>
                <TradeMyOffersPanel
                  userId={firebaseUser.uid}
                  offers={myOffers}
                  onRefresh={onRefresh}
                  refreshing={refreshing}
                />
              </Box>
            ) : (
              <Box paddingHorizontal="lg">
                <Text variant="bodyMuted">{t('tradeMarketScreen.loginForOffers')}</Text>
              </Box>
            )
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={tradeTheme.colors.tradePrimary}
                />
              }
              ListEmptyComponent={
                <Box paddingHorizontal="lg" paddingTop="xl" alignItems="center">
                  <Text variant="bodyMuted" style={{ textAlign: 'center' }}>
                    {t('tradeMarketScreen.emptyMarket')}
                  </Text>
                </Box>
              }
              contentContainerStyle={{
                paddingHorizontal: tradeTheme.spacing.lg,
                paddingBottom: tabBarPadding,
                flexGrow: listings.length === 0 ? 1 : undefined,
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Box>

        {firebaseUser ? (
          <TradeSubmitOfferModal
            visible={selectedListing !== null}
            listing={selectedListing}
            userId={firebaseUser.uid}
            onClose={() => setSelectedListing(null)}
            onSubmitted={load}
          />
        ) : null}
      </Screen>
    </ThemeProvider>
  );
}
