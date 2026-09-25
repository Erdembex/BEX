import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/i18n';
import { IS_COMPACT_HEIGHT, ONBOARDING_COLORS, rs } from './onboardingTheme';

const SS_MARK = require('../../../assets/branding/onboarding/ss-mark.png');
const SS_MARK_ASPECT = 805 / 532;

type Props = {
  currentStep: number;
  stepCount: number;
  onSkip?: () => void;
};

export function OnboardingHeader({ currentStep, stepCount, onSkip }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityLabel="Passla" />
      <Text style={styles.slogan}>{t('auth.onboarding.slogan')}</Text>
      <View
        style={styles.progressRow}
        accessibilityLabel={t('auth.onboarding.stepLabel', { current: currentStep + 1, total: stepCount })}
      >
        {Array.from({ length: stepCount }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i === currentStep ? styles.segmentActive : styles.segmentInactive]}
          />
        ))}
      </View>

      {onSkip ? (
        <TouchableOpacity
          style={styles.skip}
          onPress={onSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>{t('auth.onboarding.skip')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const MARK_HEIGHT = IS_COMPACT_HEIGHT ? rs(34) : rs(40);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  mark: {
    height: MARK_HEIGHT,
    width: MARK_HEIGHT * SS_MARK_ASPECT,
  },
  slogan: {
    marginTop: rs(10),
    fontFamily: 'Inter_600SemiBold',
    fontSize: Math.max(10, rs(9)),
    letterSpacing: rs(1.6),
    color: ONBOARDING_COLORS.slogan,
  },
  progressRow: {
    marginTop: IS_COMPACT_HEIGHT ? rs(14) : rs(20),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: rs(38),
    gap: rs(4),
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  segmentActive: {
    height: 3,
    backgroundColor: ONBOARDING_COLORS.navy,
  },
  segmentInactive: {
    height: 2,
    backgroundColor: ONBOARDING_COLORS.progressInactive,
  },
  skip: {
    position: 'absolute',
    top: 0,
    right: rs(22),
  },
  skipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: rs(13),
    color: ONBOARDING_COLORS.slogan,
  },
});
