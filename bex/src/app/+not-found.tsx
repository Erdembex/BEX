import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/ui';
import { Typography, Spacing, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function NotFoundScreen() {
  const Colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <Screen style={[styles.safe, { backgroundColor: Colors.background }]}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🧭</Text>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>{t('notFound.title')}</Text>
          <Text style={[styles.body, { color: Colors.textSecondary }]}>{t('notFound.body')}</Text>
          <Button title={t('notFound.goHome')} onPress={() => router.replace('/(tabs)/home')} />
          <Button
            title={t('notFound.goTasks')}
            variant="outline"
            onPress={() => router.replace('/(tabs)/tasks')}
          />
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[3],
  },
  emoji: { fontSize: 48 },
  title: {
    ...Typography.headingLarge,
    textAlign: 'center',
  },
  body: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[2],
  },
});
