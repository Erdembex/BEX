import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BannedScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { signOut } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await authService.logout();
    signOut();
    router.replace('/(auth)/login');
  };

  return (
    <Screen style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⛔</Text>
        <Text style={styles.title}>{t('bannedScreen.title')}</Text>
        <Text style={styles.text}>
          {t('bannedScreen.text')}
        </Text>
        <Button title={t('bannedScreen.logout')} variant="outline" onPress={handleLogout} loading={loading} />
      </View>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[4],
  },
  emoji: { fontSize: 56 },
  title: { ...Typography.headingLarge, color: Colors.textPrimary, textAlign: 'center' },
  text: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
}));
