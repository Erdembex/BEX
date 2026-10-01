import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { Spacing, createThemedStyles } from '@/theme';
import { Button } from '@/components/ui';

type Props = {
  isLast: boolean;
  onNext: () => void;
  onRegister: () => void;
  onLogin: () => void;
};

export function OnboardingFooter({ isLast, onNext, onRegister, onLogin }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();

  if (isLast) {
    return (
      <View style={styles.wrap}>
        <Button title={t('auth.onboarding.register')} onPress={onRegister} fullWidth size="lg" />
        <Button
          title={t('auth.onboarding.login')}
          onPress={onLogin}
          variant="ghost"
          fullWidth
          size="md"
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button title={t('auth.onboarding.next')} onPress={onNext} fullWidth size="lg" />
    </View>
  );
}

const useStyles = createThemedStyles(() =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: Spacing[6],
      paddingTop: Spacing[4],
      gap: Spacing[3],
    },
  })
);
