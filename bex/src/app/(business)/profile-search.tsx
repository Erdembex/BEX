import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { usersRepository } from '@/features/data';
import { Button, Input } from '@/components/ui';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { BackHeader } from '@/components/navigation/BackHeader';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BusinessProfileSearchScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    username: string;
    displayName: string;
    avatarUrl: string | null;
    completedTaskCount: number;
    portfolioCount: number;
    recentTasks: Array<{ applicationId: string; taskTitle: string }>;
  } | null>(null);

  const handleSearch = async () => {
    const normalized = query.trim().toLowerCase().replace(/^@/, '');
    if (normalized.length < 3) {
      setError(t('businessProfileSearchScreen.minCharsError'));
      setPreview(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const profile = await usersRepository.getPublicProfileByUsername(normalized);
      if (!profile) {
        setPreview(null);
        setError(t('businessProfileSearchScreen.notFoundError'));
        return;
      }
      setPreview({
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        completedTaskCount: profile.completedTaskCount,
        portfolioCount: profile.portfolio.length,
        recentTasks: profile.completedTasks.slice(0, 3).map((task) => ({
          applicationId: task.applicationId,
          taskTitle: task.taskTitle,
        })),
      });
    } catch {
      setPreview(null);
      setError(t('businessProfileSearchScreen.searchError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen style={styles.safe}>
      <BackHeader title={t('businessProfileSearchScreen.title')} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          {t('businessProfileSearchScreen.subtitle')}
        </Text>

        <Input
          label={t('businessProfileSearchScreen.usernameLabel')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('businessProfileSearchScreen.usernamePlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title={t('businessProfileSearchScreen.findProfile')} onPress={handleSearch} loading={loading} />

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[4] }} />
        ) : null}

        {preview ? (
          <View style={styles.previewCard}>
            <ProfileAvatar
              name={preview.displayName}
              avatarUrl={preview.avatarUrl}
              size={56}
            />
            <Text style={styles.previewName}>{preview.displayName}</Text>
            <Text style={styles.previewMeta}>
              {t('businessProfileSearchScreen.completedTasksMeta', { count: preview.completedTaskCount, portfolio: preview.portfolioCount })}
            </Text>
            {preview.recentTasks.length > 0 ? (
              <View style={styles.recentTasks}>
                {preview.recentTasks.map((task) => (
                  <Text key={task.applicationId} style={styles.recentTaskItem} numberOfLines={1}>
                    · {task.taskTitle}
                  </Text>
                ))}
              </View>
            ) : null}
            <Button
              title={t('businessProfileSearchScreen.viewPortfolio')}
              variant="secondary"
              onPress={() =>
                router.push(`/user/u/${preview.username}` as Href)
              }
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  error: { ...Typography.bodySmall, color: Colors.error },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    alignItems: 'center',
    gap: Spacing[2],
  },
  previewName: { ...Typography.labelLarge, color: Colors.textPrimary },
  previewMeta: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  recentTasks: { width: '100%', gap: 2, marginTop: Spacing[1] },
  recentTaskItem: { ...Typography.caption, color: Colors.textSecondary },
}));
