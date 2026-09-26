import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { createBox } from '@shopify/restyle';
import { Text } from '@/components/ui/Text';
import { tradeTheme, TradeTheme } from './tradeTheme';
import { tradeRepository } from './tradeRepository';
import { TradeHistoryEntry, TradeHistoryStatus } from './types';
import { useTranslation } from '@/i18n';

const Box = createBox<TradeTheme>();

const STATUS_COLOR: Record<TradeHistoryStatus, string> = {
  completed: tradeTheme.colors.success,
  accepted: tradeTheme.colors.tradePrimary,
  rejected: tradeTheme.colors.error,
  cancelled: tradeTheme.colors.textMuted,
  pending: tradeTheme.colors.tradeAccent,
};

interface TradeHistoryPanelProps {
  userId: string;
  bottomPadding?: number;
  headerComponent?: React.ReactNode;
}

export function TradeHistoryPanel({
  userId,
  bottomPadding,
  headerComponent,
}: TradeHistoryPanelProps) {
  const { t } = useTranslation();
  const STATUS_LABEL: Record<TradeHistoryStatus, string> = {
    completed: t('tradeHistoryPanel.statusCompleted'),
    accepted: t('tradeHistoryPanel.statusAccepted'),
    rejected: t('tradeHistoryPanel.statusRejected'),
    cancelled: t('tradeHistoryPanel.statusCancelled'),
    pending: t('tradeHistoryPanel.statusPending'),
  };
  const [entries, setEntries] = useState<TradeHistoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const history = await tradeRepository.getTradeHistory(userId);
    setEntries(history);
  }, [userId]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      style={{ flex: 1 }}
      ListHeaderComponent={() => (
        <>
          {headerComponent}
          <Box
            padding="md"
            marginBottom="md"
            borderRadius="md"
            backgroundColor="surface"
            borderWidth={1}
            borderColor="border"
          >
            <Text variant="caption" style={{ color: tradeTheme.colors.tradePrimary, fontWeight: '700' }}>
              {t('tradeHistoryPanel.headerTitle')}
            </Text>
            <Text variant="body" marginTop="xs" style={{ color: tradeTheme.colors.textSecondary, lineHeight: 22 }}>
              {t('tradeHistoryPanel.headerSubtitle')}
            </Text>
          </Box>
        </>
      )}
      contentContainerStyle={{
        paddingHorizontal: tradeTheme.spacing.lg,
        paddingBottom: bottomPadding ?? tradeTheme.spacing['2xl'],
        flexGrow: entries.length === 0 ? 1 : undefined,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={tradeTheme.colors.tradePrimary}
        />
      }
      ListEmptyComponent={
        <Box paddingTop="xl" alignItems="center" paddingHorizontal="md">
          <Text variant="body" style={{ color: tradeTheme.colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
            {t('tradeHistoryPanel.empty')}
          </Text>
        </Box>
      }
      renderItem={({ item, index }) => (
        <Box
          backgroundColor="surface"
          borderRadius="md"
          padding="md"
          marginBottom="sm"
          borderWidth={1}
          borderColor="border"
        >
          <Box flexDirection="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1} marginRight="sm">
              <Text variant="label" numberOfLines={1}>
                {item.title}
              </Text>
              <Text variant="caption" marginTop="xs">
                {item.subtitle}
              </Text>
            </Box>
            <Box
              paddingHorizontal="sm"
              paddingVertical="xs"
              borderRadius="sm"
              style={{ backgroundColor: STATUS_COLOR[item.status] + '14' }}
            >
              <Text
                variant="caption"
                style={{ color: STATUS_COLOR[item.status], fontWeight: '700' }}
              >
                {STATUS_LABEL[item.status]}
              </Text>
            </Box>
          </Box>

          <Text variant="bodyMuted" marginTop="sm" style={{ fontSize: 13, lineHeight: 19 }}>
            {item.detail}
          </Text>

          <Box
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            marginTop="md"
            paddingTop="sm"
            borderTopWidth={1}
            borderTopColor="border"
          >
            <Text variant="caption">{item.createdAtLabel}</Text>
            <Text variant="caption" style={{ color: tradeTheme.colors.textMuted }}>
              #{String(index + 1).padStart(3, '0')}
            </Text>
          </Box>
        </Box>
      )}
    />
  );
}
