import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import type { IndividualSearchHit } from '@/features/portfolio/publicProfileApi';

type Props = {
  results: IndividualSearchHit[];
  loading: boolean;
  error: string | null;
  queryLength: number;
  minChars?: number;
  onSelect: (hit: IndividualSearchHit) => void;
  emptyHint?: string;
  maxHeight?: number;
};

export function UsernameSearchResults({
  results,
  loading,
  error,
  queryLength,
  minChars = 2,
  onSelect,
  emptyHint,
  maxHeight = 320,
}: Props) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();

  if (loading) {
    return <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />;
  }

  if (error) {
    return <Text style={styles.error}>{t('usernameSearch.searchFailed')}</Text>;
  }

  if (queryLength < minChars) {
    return (
      <Text style={styles.hint}>
        {t('usernameSearch.minChars', { count: minChars })}
      </Text>
    );
  }

  if (results.length === 0) {
    return (
      <Text style={styles.hint}>
        {emptyHint ?? t('usernameSearch.noMatches')}
      </Text>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { maxHeight }]}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      {results.map((item) => {
        const primary = item.username ? `@${item.username}` : item.fullName;
        const secondary =
          item.username && item.fullName && item.fullName !== item.username
            ? item.fullName
            : null;

        return (
          <TouchableOpacity
            key={item.profileId}
            style={styles.row}
            onPress={() => onSelect(item)}
            activeOpacity={0.85}
          >
            <ProfileAvatar name={primary} avatarUrl={item.avatarUrl} size={40} />
            <View style={styles.meta}>
              <Text style={styles.primary} numberOfLines={1}>
                {primary}
              </Text>
              {secondary ? (
                <Text style={styles.secondary} numberOfLines={1}>
                  {secondary}
                </Text>
              ) : null}
              <Text style={styles.taskMeta}>
                {t('usernameSearch.completedTasks', { count: item.completedTaskCount })}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  scroll: { marginTop: Spacing[1] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  meta: { flex: 1, gap: 2 },
  primary: { ...Typography.labelMedium, color: Colors.textPrimary, fontWeight: '700' },
  secondary: { ...Typography.caption, color: Colors.textSecondary },
  taskMeta: { ...Typography.caption, color: Colors.textMuted },
  hint: { ...Typography.bodySmall, color: Colors.textMuted, paddingVertical: Spacing[2] },
  error: { ...Typography.bodySmall, color: Colors.error, paddingVertical: Spacing[2] },
}));
