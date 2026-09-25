import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import type { OnboardingStep } from './onboardingSteps';
import { IS_COMPACT_HEIGHT, ONBOARDING_COLORS, rs } from './onboardingTheme';

type Props = {
  step: OnboardingStep;
};

export function OnboardingStepContent({ step }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.8}>
        {t(step.titleKey)}
      </Text>
      <View style={styles.artWrap}>
        <Image source={step.illustration} style={styles.art} resizeMode="contain" fadeDuration={0} />
      </View>
      <Text style={styles.description}>{t(step.descriptionKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  title: {
    marginTop: IS_COMPACT_HEIGHT ? rs(14) : rs(20),
    paddingHorizontal: rs(30),
    fontFamily: 'Inter_700Bold',
    fontSize: IS_COMPACT_HEIGHT ? rs(26) : rs(31),
    lineHeight: IS_COMPACT_HEIGHT ? rs(31) : rs(37),
    letterSpacing: -0.4,
    color: ONBOARDING_COLORS.navy,
  },
  artWrap: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: rs(4),
  },
  art: {
    width: '100%',
    height: '100%',
  },
  description: {
    paddingHorizontal: rs(34),
    fontFamily: 'Inter_400Regular',
    fontSize: IS_COMPACT_HEIGHT ? rs(12) : rs(13),
    lineHeight: IS_COMPACT_HEIGHT ? rs(19) : rs(21),
    color: ONBOARDING_COLORS.body,
  },
});
