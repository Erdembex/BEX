import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_GOLD, BRAND_GOLD_VIVID, BRAND_NAVY } from '@/theme/brand';

const AUTH_TEA_GLASS = require('../../../assets/branding/auth-tea-glass.png');

const { width, height } = Dimensions.get('window');

/** Giriş ekranı — lacivert gradient + çay bardağı arka plan */
export function AuthLoginBackground() {
  const teaSize = Math.min(width * 0.92, height * 0.42, 420);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[BRAND_NAVY, BRAND_NAVY, BRAND_NAVY, BRAND_NAVY]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Image
        source={AUTH_TEA_GLASS}
        style={[
          styles.tea,
          {
            width: teaSize,
            height: teaSize,
            top: height * 0.06,
            left: (width - teaSize) / 2,
          },
        ]}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />

      <View style={[styles.glow, styles.glowGoldTop]} />
      <View style={[styles.glow, styles.glowGoldMid]} />
    </View>
  );
}

const styles = StyleSheet.create({
  tea: {
    position: 'absolute',
    opacity: 0.34,
  },
  glow: {
    position: 'absolute',
    borderRadius: 9999,
  },
  glowGoldTop: {
    width: width * 0.85,
    height: width * 0.85,
    top: -width * 0.35,
    right: -width * 0.25,
    backgroundColor: BRAND_GOLD_VIVID,
    opacity: 0.08,
  },
  glowGoldMid: {
    width: width * 0.55,
    height: width * 0.55,
    bottom: height * 0.08,
    left: -width * 0.2,
    backgroundColor: BRAND_GOLD,
    opacity: 0.05,
  },
});
