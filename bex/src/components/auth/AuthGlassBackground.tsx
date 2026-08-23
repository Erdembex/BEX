import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRAND_GOLD, BRAND_GOLD_VIVID } from '@/theme/brand';

const { width, height } = Dimensions.get('window');

/** Auth ekranları — sakin lacivert-altın arka plan */
export function AuthGlassBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#051F45', '#061528', '#030C16', '#010810']}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.glow, styles.glowGoldTop]} />
      <View style={[styles.glow, styles.glowGoldMid]} />
      <View style={[styles.glow, styles.glowBlue]} />
      <View style={[styles.glow, styles.glowGoldBottom]} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    opacity: 0.1,
  },
  glowGoldMid: {
    width: width * 0.55,
    height: width * 0.55,
    top: height * 0.18,
    left: -width * 0.2,
    backgroundColor: BRAND_GOLD,
    opacity: 0.07,
  },
  glowBlue: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: height * 0.12,
    right: -width * 0.15,
    backgroundColor: '#8FAFD4',
    opacity: 0.06,
  },
  glowGoldBottom: {
    width: width * 0.45,
    height: width * 0.45,
    bottom: -width * 0.1,
    left: width * 0.15,
    backgroundColor: BRAND_GOLD_VIVID,
    opacity: 0.08,
  },
});
