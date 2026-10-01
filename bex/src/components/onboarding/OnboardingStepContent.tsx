import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from '@/i18n';
import type { OnboardingStep } from './onboardingSteps';
import { Spacing, Typography, createThemedStyles } from '@/theme';
import { useOnboardingLayout } from './onboardingTheme';

type Props = {
  step: OnboardingStep;
};

export function OnboardingStepContent({ step }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { IS_COMPACT_HEIGHT } = useOnboardingLayout();
  const { width, height } = useWindowDimensions();

  const artHeight = useMemo(() => {
    const max = IS_COMPACT_HEIGHT ? 200 : 260;
    return Math.min(Math.round(width * 0.65), Math.round(height * 0.28), max);
  }, [IS_COMPACT_HEIGHT, height, width]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.artWrap, { height: artHeight }]}>
        <Image source={step.illustration} style={styles.art} resizeMode="contain" />
      </View>
      <Text style={styles.title}>{t(step.titleKey).replace(/\n/g, ' ')}</Text>
      <Text style={styles.description}>{t(step.descriptionKey)}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((Colors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      paddingHorizontal: Spacing[6],
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing[4],
    },
    artWrap: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    art: {
      width: '100%',
      height: '100%',
      maxWidth: 320,
    },
    title: {
      ...Typography.headingMedium,
      color: Colors.textPrimary,
      textAlign: 'center',
    },
    description: {
      ...Typography.bodyMedium,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 340,
    },
  })
);
