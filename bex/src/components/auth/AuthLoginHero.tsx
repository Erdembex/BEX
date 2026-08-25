import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';

const WORDMARK = require('../../../assets/branding/passla-wordmark-istanbul-letters.png');

/** Giriş ekranı — parşömensiz İstanbul tarzı PASSLA wordmark */
export function AuthLoginHero() {
  const { width } = useWindowDimensions();
  const wordmarkWidth = Math.min(width * 0.86, 340);
  const wordmarkHeight = Math.round(wordmarkWidth * (551 / 1429));

  return (
    <View style={styles.wrap} accessibilityRole="header">
      <Image
        source={WORDMARK}
        style={{ width: wordmarkWidth, height: wordmarkHeight }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
});
