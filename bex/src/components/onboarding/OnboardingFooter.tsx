import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { pageReadableText } from '@/lib/pageLayout';
import { ONBOARDING_COLORS, useOnboardingTheme } from './onboardingTheme';

type Props = {
  isLast: boolean;
  onNext: () => void;
  onRegister: () => void;
  onLogin: () => void;
};

export function OnboardingFooter({ isLast, onNext, onRegister, onLogin }: Props) {
  const { t } = useTranslation();
  const { rs, IS_COMPACT_HEIGHT } = useOnboardingTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: rs(24),
          marginTop: IS_COMPACT_HEIGHT ? rs(12) : rs(18),
          flexShrink: 0,
        },
        wrapLast: {
          alignItems: 'center',
          paddingHorizontal: rs(24),
          marginTop: IS_COMPACT_HEIGHT ? rs(12) : rs(18),
          gap: rs(10),
          flexShrink: 0,
        },
        button: {
          minWidth: rs(132),
          height: rs(44),
          paddingHorizontal: rs(28),
          borderRadius: 999,
          backgroundColor: ONBOARDING_COLORS.buttonFill,
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonWide: {
          alignSelf: 'stretch',
          maxWidth: 320,
        },
        buttonText: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: rs(13.5),
          color: ONBOARDING_COLORS.buttonText,
          ...pageReadableText,
        },
        secondary: {
          minHeight: rs(40),
          paddingHorizontal: rs(16),
          alignItems: 'center',
          justifyContent: 'center',
        },
        secondaryText: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: rs(13.5),
          color: ONBOARDING_COLORS.link,
          ...pageReadableText,
        },
      }),
    [IS_COMPACT_HEIGHT, rs]
  );

  if (isLast) {
    return (
      <View style={styles.wrapLast}>
        <PrimaryButton label={t('auth.onboarding.register')} onPress={onRegister} wide styles={styles} />
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
      <PrimaryButton label={t('auth.onboarding.next')} onPress={onNext} styles={styles} />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  wide = false,
  styles,
}: {
  label: string;
  onPress: () => void;
  wide?: boolean;
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, wide && styles.buttonWide]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}
