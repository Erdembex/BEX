import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { Spacing, Typography, createThemedStyles } from '@/theme';

type Props = {
  currentStep: number;
  stepCount: number;
  onSkip?: () => void;
};

export function OnboardingHeader({ currentStep, stepCount, onSkip }: Props) {
  const { t } = useTranslation();
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {onSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={12} accessibilityRole="button">
            <Text style={styles.skip}>{t('auth.onboarding.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

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
    </View>
  );
}

const useStyles = createThemedStyles((Colors) =>
  StyleSheet.create({
    wrap: {
      paddingHorizontal: Spacing[6],
      paddingBottom: Spacing[4],
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      minHeight: 32,
      alignItems: 'center',
    },
    skip: {
      ...Typography.labelMedium,
      color: Colors.textSecondary,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing[2],
      marginTop: Spacing[2],
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Colors.border,
    },
    dotActive: {
      backgroundColor: Colors.primary,
      width: 24,
    },
  })
);
