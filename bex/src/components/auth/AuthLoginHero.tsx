import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Spacing } from '@/theme';

const WORDMARK_ISTANBUL = require('../../../assets/branding/passla-wordmark-istanbul.png');
const AUTH_TEA_GLASS = require('../../../assets/branding/auth-tea-glass.png');

/** Giriş ekranı — İstanbul tarzı PASSLA + çay bardağı illüstrasyonu */
export function AuthLoginHero() {
  const { width } = useWindowDimensions();
  const wordmarkWidth = Math.min(width * 0.88, 360);
  const wordmarkHeight = Math.round(wordmarkWidth * (1024 / 1536));
  const teaSize = Math.min(width * 0.46, 220);

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Image
        source={WORDMARK_ISTANBUL}
        style={{ width: wordmarkWidth, height: wordmarkHeight }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />
      <Image
        source={AUTH_TEA_GLASS}
        style={{ width: teaSize, height: teaSize, marginTop: -Spacing[2] }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Çay bardağı"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing[1],
  },
});
