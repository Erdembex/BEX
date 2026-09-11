import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Input } from '@/components/ui';
import {
  searchBusinessProfiles,
  type BusinessSearchHit,
} from '@/features/business/businessProfileApi';
import { BUSINESS_CATEGORY_LABELS } from '@/constants/businessLabels';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface BusinessPickerProps {
  selectedId: string;
  selectedName: string;
  onSelect: (business: BusinessSearchHit) => void;
  onClear?: () => void;
}

export function BusinessPicker({
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: BusinessPickerProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const hits = await searchBusinessProfiles(trimmed);
      setResults(hits);
    } catch {
      setResults([]);
      setError(t('businessPicker.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <View style={styles.wrap}>
      {selectedId ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedText}>
            <Text style={styles.selectedLabel}>{t('businessPicker.selectedBusiness')}</Text>
            <Text style={styles.selectedName}>{selectedName}</Text>
          </View>
          {onClear ? (
            <TouchableOpacity onPress={onClear} hitSlop={8}>
              <Text style={styles.changeLink}>{t('businessPicker.change')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <>
          <Input
            label={t('businessPicker.searchLabel')}
            value={query}
            onChangeText={setQuery}
            placeholder={t('businessPicker.searchPlaceholder')}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />
          ) : (
            <ScrollView
              style={styles.resultsScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {query.trim().length < 2 ? (
                <Text style={styles.empty}>{t('usernameSearch.minChars', { count: 2 })}</Text>
              ) : results.length === 0 ? (
                <Text style={styles.empty}>{t('businessPicker.noMatches')}</Text>
              ) : (
                results.map((item) => (
                  <TouchableOpacity
                    key={item.profileId}
                    style={styles.resultRow}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={styles.resultName}>{item.businessName}</Text>
                    <Text style={styles.resultMeta}>
                      {BUSINESS_CATEGORY_LABELS[item.category]}
                      {item.locationLabel ? ` · ${item.locationLabel}` : ''}
                      {item.verified ? ` · ${t('businessPicker.verified')}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: { gap: Spacing[2] },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: Spacing[3],
  },
  selectedText: { flex: 1, gap: 2 },
  selectedLabel: { ...Typography.caption, color: Colors.textMuted },
  selectedName: { ...Typography.labelLarge, color: Colors.textPrimary },
  changeLink: { ...Typography.labelMedium, color: Colors.primary },
  error: { ...Typography.bodySmall, color: Colors.error },
  empty: { ...Typography.bodySmall, color: Colors.textMuted, paddingVertical: Spacing[2] },
  resultsScroll: { maxHeight: 220 },
  resultRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 2,
  },
  resultName: { ...Typography.labelMedium, color: Colors.textPrimary },
  resultMeta: { ...Typography.caption, color: Colors.textMuted },
}));
