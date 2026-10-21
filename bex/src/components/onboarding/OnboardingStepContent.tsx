import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from '@/i18n';
import { FontFamily } from '@/theme';
import type { OnboardingStep } from './onboardingSteps';
import { OnboardingArt } from './OnboardingArt';

const CREAM = '#F0EEE9';

type Props = {
  step: OnboardingStep;
};

export function OnboardingStepContent({ step }: Props) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const artHeight = useMemo(() => Math.min(320, Math.max(168, height - 520)), [height]);

  return (
    <View style={styles.wrap}>
      <View style={styles.art}>
        <OnboardingArt id={step.id} height={artHeight} />
      </View>
      <Text style={styles.title}>{t(step.titleKey)}</Text>
      <Text style={styles.description}>{t(step.descriptionKey)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  art: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
    color: CREAM,
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 23,
    color: 'rgba(240,238,233,0.78)',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 320,
  },
});
