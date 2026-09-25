import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/i18n';
import { IS_COMPACT_HEIGHT, ONBOARDING_COLORS, rs } from './onboardingTheme';

type Props = {
  isLast: boolean;
  onNext: () => void;
  onRegister: () => void;
  onLogin: () => void;
};

export function OnboardingFooter({ isLast, onNext, onRegister, onLogin }: Props) {
  const { t } = useTranslation();

  if (isLast) {
    return (
      <View style={styles.wrap}>
        <PrimaryButton label={t('auth.onboarding.register')} onPress={onRegister} />
        <TouchableOpacity
          style={styles.secondary}
          onPress={onLogin}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryText}>{t('auth.onboarding.login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <PrimaryButton label={t('auth.onboarding.next')} onPress={onNext} />
      <View style={styles.spacer} />
      <Ionicons name="star-outline" size={rs(15)} color={ONBOARDING_COLORS.star} />
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: rs(38),
    paddingRight: rs(48),
    marginTop: IS_COMPACT_HEIGHT ? rs(16) : rs(22),
  },
  button: {
    minWidth: rs(118),
    height: rs(44),
    paddingHorizontal: rs(28),
    borderRadius: 999,
    backgroundColor: ONBOARDING_COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: rs(13.5),
    color: '#FFFFFF',
  },
  secondary: {
    height: rs(44),
    paddingHorizontal: rs(20),
    marginLeft: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: rs(13.5),
    color: ONBOARDING_COLORS.navy,
  },
  spacer: {
    flex: 1,
  },
});
