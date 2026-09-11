import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { Input } from '@/components/ui';
import { BackHeader } from '@/components/navigation/BackHeader';
import { UsernameSearchResults } from '@/components/profile/UsernameSearchResults';
import { useUsernameSearch } from '@/hooks/useUsernameSearch';
import { Typography, Spacing, createThemedStyles } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BusinessProfileSearchScreen() {
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { query, setQuery, results, loading, error, trimmedLength } = useUsernameSearch();

  return (
    <Screen style={styles.safe}>
      <BackHeader title={t('businessProfileSearchScreen.title')} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>{t('businessProfileSearchScreen.subtitle')}</Text>

        <Input
          label={t('businessProfileSearchScreen.usernameLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('businessProfileSearchScreen.usernamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />

        <View style={styles.resultsWrap}>
          <UsernameSearchResults
            results={results}
            loading={loading}
            error={error}
            queryLength={trimmedLength}
            onSelect={(hit) => {
              if (hit.username) {
                router.push(`/user/u/${hit.username}` as Href);
              }
            }}
            emptyHint={t('businessProfileSearchScreen.notFoundError')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  resultsWrap: { minHeight: 120 },
}));
