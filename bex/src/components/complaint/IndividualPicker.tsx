import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Input } from '@/components/ui';
import { searchIndividualProfiles, type IndividualSearchHit } from '@/features/portfolio/publicProfileApi';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { USERNAME_SEARCH_MIN_CHARS } from '@/hooks/useUsernameSearch';

interface IndividualPickerProps {
  selectedId: string;
  selectedName: string;
  onSelect: (individual: IndividualSearchHit) => void;
  onClear?: () => void;
}

export function IndividualPicker({
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: IndividualPickerProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IndividualSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const trimmed = query.trim().replace(/^@/, '');

  const runSearch = useCallback(async (term: string) => {
    const normalized = term.trim().replace(/^@/, '');
    if (normalized.length < USERNAME_SEARCH_MIN_CHARS) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const hits = await searchIndividualProfiles(normalized);
      setResults(hits);
    } catch {
      setResults([]);
      setError(t('individualPicker.loadFailed'));
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
            <Text style={styles.selectedLabel}>{t('individualPicker.selectedUser')}</Text>
            <Text style={styles.selectedName}>{selectedName}</Text>
          </View>
          {onClear ? (
            <TouchableOpacity onPress={onClear} hitSlop={8}>
              <Text style={styles.changeLink}>{t('individualPicker.change')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <>
          <Input
            label={t('individualPicker.searchLabel')}
            value={query}
            onChangeText={setQuery}
            placeholder={t('individualPicker.searchPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />
          ) : (
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {trimmed.length < USERNAME_SEARCH_MIN_CHARS ? (
                <Text style={styles.empty}>{t('usernameSearch.minChars', { count: USERNAME_SEARCH_MIN_CHARS })}</Text>
              ) : results.length === 0 ? (
                <Text style={styles.empty}>{t('individualPicker.noMatches')}</Text>
              ) : (
                results.map((item) => (
                  <TouchableOpacity
                    key={item.profileId}
                    style={styles.resultRow}
                    onPress={() => onSelect(item)}
                  >
                    <View style={styles.rowInner}>
                      <ProfileAvatar
                        name={item.username ? `@${item.username}` : item.fullName}
                        avatarUrl={item.avatarUrl}
                        size={36}
                      />
                      <View style={styles.rowText}>
                        <Text style={styles.resultName}>
                          {item.username ? `@${item.username}` : item.fullName}
                        </Text>
                        {item.fullName && item.username ? (
                          <Text style={styles.resultSubName} numberOfLines={1}>
                            {item.fullName}
                          </Text>
                        ) : null}
                        <Text style={styles.resultMeta}>
                          {t('individualPicker.completedTaskCount', { count: item.completedTaskCount })}
                        </Text>
                      </View>
                    </View>
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
  resultsScroll: { maxHeight: 240 },
  resultRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  rowText: { flex: 1, gap: 2 },
  resultName: { ...Typography.labelMedium, color: Colors.textPrimary },
  resultSubName: { ...Typography.caption, color: Colors.textSecondary },
  resultMeta: { ...Typography.caption, color: Colors.textMuted },
}));
