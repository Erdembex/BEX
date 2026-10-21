import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { FontFamily } from '@/theme';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';

type Props = {
  currentStep: number;
  stepCount: number;
  isLast: boolean;
  onNext: () => void;
  onRegister: () => void;
  onLogin: () => void;
};

export function OnboardingFooter({
  currentStep,
  stepCount,
  isLast,
  onNext,
  onRegister,
  onLogin,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <View
        style={styles.dots}
        accessibilityLabel={t('auth.onboarding.stepLabel', {
          current: currentStep + 1,
          total: stepCount,
        })}
      >
        {Array.from({ length: stepCount }, (_, i) => (
          <View key={i} style={[styles.dot, i === currentStep && styles.dotActive]} />
        ))}
      </View>
      {isLast ? (
        <>
          <Pressable onPress={onRegister} style={styles.btn} accessibilityRole="button">
            <Text style={styles.btnLabel}>{t('auth.onboarding.register')}</Text>
          </Pressable>
          <Pressable onPress={onLogin} style={styles.ghost} accessibilityRole="button">
            <Text style={styles.ghostLabel}>{t('auth.onboarding.login')}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable onPress={onNext} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnLabel}>{t('auth.onboarding.next')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(240,238,233,0.28)',
  },
  dotActive: {
    width: 28,
    backgroundColor: CREAM,
  },
  btn: {
    height: 56,
    borderRadius: 999,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: NAVY,
  },
  ghost: {
    height: 44,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: CREAM,
  },
});
