import React from 'react';
import { View, Text, Image, StyleSheet, Platform, type ImageStyle } from 'react-native';
import { useTranslation } from '@/i18n';
import { Typography, useThemeColors, useIsDarkMode } from '@/theme';
import { BRAND_GOLD_MID, BRAND_NAVY } from '@/theme/brand';

const MARK_WHITE = require('../../../assets/branding/passla-mark-white.png');
const MARK_NAVY = require('../../../assets/branding/passla-mark-navy.png');

interface PasslaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  centered?: boolean;
  /** Header: PASSLA yazısı · mark: SS işareti */
  variant?: 'wordmark' | 'mark';
  /** Koyu arka plan üzerinde (auth ekranları) açık renk kullan */
  tone?: 'auto' | 'onDark';
}

const WORDMARK_FONT = {
  xs: 15,
  sm: 18,
  md: 22,
  lg: 28,
} as const;

const MARK_SIZE = { xs: 40, sm: 52, md: 68, lg: 88 } as const;

const ON_DARK_TAGLINE = 'rgba(240, 238, 233, 0.72)';

export function PasslaLogo({
  size = 'md',
  showTagline = false,
  centered = false,
  variant = 'wordmark',
  tone = 'auto',
}: PasslaLogoProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const isDark = useIsDarkMode();
  const useLightWordmark = tone === 'onDark' || (tone === 'auto' && isDark);
  const taglineColor = useLightWordmark ? ON_DARK_TAGLINE : Colors.textMuted;
  const wordmarkColor = useLightWordmark ? BRAND_GOLD_MID : BRAND_NAVY;

  if (variant === 'wordmark') {
    return (
      <View style={[styles.container, centered && styles.containerCentered]}>
        <Text
          style={[
            styles.wordmark,
            {
              color: wordmarkColor,
              fontSize: WORDMARK_FONT[size],
            },
          ]}
          accessibilityRole="header"
          accessibilityLabel="PASSLA"
        >
          PASSLA
        </Text>
        {showTagline ? (
          <Text style={[styles.tagline, centered && styles.taglineCentered, { color: taglineColor }]}>
            {t('passlaLogo.tagline')}
          </Text>
        ) : null}
      </View>
    );
  }

  const imageStyle: ImageStyle = {
    width: MARK_SIZE[size],
    height: MARK_SIZE[size],
  };

  const source = useLightWordmark ? MARK_WHITE : MARK_NAVY;

  return (
    <View style={[styles.container, centered && styles.containerCentered]}>
      <Image
        source={source}
        style={imageStyle}
        resizeMode="contain"
        {...(Platform.OS === 'android' ? { resizeMethod: 'scale' as const } : {})}
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
  wordmark: {
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
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
