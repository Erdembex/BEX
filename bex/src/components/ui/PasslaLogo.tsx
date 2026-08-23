import React from 'react';
import { View, Text, Image, StyleSheet, type ImageStyle } from 'react-native';
import { useTranslation } from '@/i18n';
import { Typography, useThemeColors } from '@/theme';

const WORDMARK_WHITE = require('../../../assets/branding/passla-wordmark-white.png');
const WORDMARK_NAVY = require('../../../assets/branding/passla-wordmark-navy.png');

interface PasslaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
  /** Koyu arka plan üzerinde (auth ekranları) açık renk kullan */
  tone?: 'auto' | 'onDark';
}

/** Wordmark aspect ~1024:335 */
const WORDMARK_WIDTH = { xs: 132, sm: 168, md: 220, lg: 280 } as const;
const WORDMARK_RATIO = 335 / 1024;

const ON_DARK_TAGLINE = 'rgba(240, 238, 233, 0.72)';

export function PasslaLogo({
  size = 'md',
  showTagline = false,
  centered = false,
  tone = 'auto',
}: PasslaLogoProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const useWhite = tone === 'onDark';
  const taglineColor = useWhite ? ON_DARK_TAGLINE : Colors.textMuted;
  const width = WORDMARK_WIDTH[size];
  const height = Math.round(width * WORDMARK_RATIO);

  const imageStyle: ImageStyle = {
    width,
    height,
  };

  return (
    <View style={[styles.container, centered && styles.containerCentered]}>
      <Image
        source={useWhite ? WORDMARK_WHITE : WORDMARK_NAVY}
        style={imageStyle}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />
      {showTagline ? (
        <Text style={[styles.tagline, centered && styles.taglineCentered, { color: taglineColor }]}>
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
  tagline: {
    ...Typography.bodySmall,
    letterSpacing: 0.2,
    textAlign: 'left',
  },
  taglineCentered: {
    textAlign: 'center',
  },
});
