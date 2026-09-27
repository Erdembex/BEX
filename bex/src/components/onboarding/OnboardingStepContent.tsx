import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { pageReadableText } from '@/lib/pageLayout';
import type { OnboardingStep } from './onboardingSteps';
import { ONBOARDING_COLORS, useOnboardingTheme } from './onboardingTheme';

type Props = {
  step: OnboardingStep;
};

export function OnboardingStepContent({ step }: Props) {
  const { t } = useTranslation();
  const { rs, IS_COMPACT_HEIGHT, height } = useOnboardingTheme();
  const artHeight = Math.round(height * (IS_COMPACT_HEIGHT ? 0.28 : 0.34));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexGrow: 1,
          alignSelf: 'stretch',
          paddingBottom: rs(8),
        },
        title: {
          marginTop: IS_COMPACT_HEIGHT ? rs(10) : rs(16),
          paddingHorizontal: rs(16),
          fontFamily: 'Inter_700Bold',
          fontSize: IS_COMPACT_HEIGHT ? rs(24) : rs(29),
          lineHeight: IS_COMPACT_HEIGHT ? rs(29) : rs(34),
          letterSpacing: -0.4,
          color: ONBOARDING_COLORS.title,
          textAlign: 'center',
          alignSelf: 'stretch',
          ...pageReadableText,
        },
        artWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: rs(6),
          alignSelf: 'stretch',
          paddingHorizontal: rs(8),
        },
        art: {
          width: '100%',
          height: '100%',
          maxWidth: 340,
        },
        description: {
          paddingHorizontal: rs(20),
          fontFamily: 'Inter_400Regular',
          fontSize: IS_COMPACT_HEIGHT ? rs(12) : rs(13),
          lineHeight: IS_COMPACT_HEIGHT ? rs(18) : rs(20),
          color: ONBOARDING_COLORS.body,
          textAlign: 'center',
          alignSelf: 'stretch',
          ...pageReadableText,
        },
      }),
    [IS_COMPACT_HEIGHT, rs]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.8}>
        {t(step.titleKey)}
      </Text>
      <View style={[styles.artWrap, { height: artHeight }]}>
        <Image source={step.illustration} style={styles.art} resizeMode="contain" fadeDuration={0} />
      </View>
      <Text style={styles.description}>{t(step.descriptionKey)}</Text>
    </View>
  );
}
