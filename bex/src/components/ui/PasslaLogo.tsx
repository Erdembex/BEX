import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '@/i18n';
import { FontFamily, Typography, useThemeColors } from '@/theme';

interface PasslaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
}

const FONT_SIZE = { xs: 17, sm: 20, md: 26, lg: 34 } as const;
const LETTER_SPACING = { xs: 2, sm: 2.5, md: 3, lg: 3.5 } as const;

export function PasslaLogo({ size = 'md', showTagline = false, centered = false }: PasslaLogoProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();

  return (
    <View style={[styles.container, centered && styles.containerCentered]}>
      <Text
        style={[
          styles.wordmark,
          {
            fontSize: FONT_SIZE[size],
            letterSpacing: LETTER_SPACING[size],
            color: Colors.textPrimary,
          },
        ]}
        accessibilityRole="header"
        accessibilityLabel="Passla"
      >
        PASSLA
      </Text>
      {showTagline ? (
        <Text style={[styles.tagline, centered && styles.taglineCentered, { color: Colors.textMuted }]}>
          {t('passlaLogo.tagline')}
        </Text>
      ) : null}
    </View>
  );
}

/** @deprecated PasslaLogo kullan */
export const BexLogo = PasslaLogo;

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 6,
  },
  containerCentered: {
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: FontFamily.extraBold,
    textTransform: 'uppercase',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: undefined,
  },
  tagline: {
    ...Typography.bodySmall,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  taglineCentered: {
    textAlign: 'center',
  },
});
