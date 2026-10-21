import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { FontFamily } from '@/theme';

const CREAM = '#F0EEE9';

type Props = {
  onSkip?: () => void;
};

export function OnboardingHeader({ onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.brand}>Passla</Text>
      {onSkip ? (
        <TouchableOpacity onPress={onSkip} hitSlop={12} accessibilityRole="button">
          <Text style={styles.skip}>{t('auth.onboarding.skip')}</Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 28,
    paddingTop: 10,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: CREAM,
  },
  skip: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: 'rgba(240,238,233,0.72)',
  },
});
