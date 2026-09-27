import React from 'react';
import { View, StyleSheet, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing } from '@/theme';

type AuthFrostCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

/** Android release'te yarı saydam kart duvar yazısını içeri alır. Kart düz beyaz. */
const FROST_IOS = 'rgba(255, 255, 255, 0.94)';
const FROST_ANDROID = '#FFFFFF';
const FROST_WEB = 'rgba(255, 255, 255, 0.96)';
const BORDER = 'rgba(255, 255, 255, 0.72)';
const LAMP_SPILL = ['rgba(255, 218, 150, 0.38)', 'rgba(255, 232, 192, 0.10)', 'rgba(255, 255, 255, 0)'] as const;

export function AuthFrostCard({ children, style, compact = false }: AuthFrostCardProps) {
  const frost = Platform.OS === 'android' ? FROST_ANDROID : FROST_IOS;
  const useBlur = Platform.OS === 'ios';

  return (
    <View style={[styles.card, { backgroundColor: frost }, style]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFillObject, styles.frostWeb]} pointerEvents="none" />
      ) : useBlur ? (
        <>
          <BlurView
            intensity={40}
            tint="light"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={[styles.frostOverlay, { backgroundColor: frost }]} pointerEvents="none" />
        </>
      ) : null}
      <LinearGradient
        colors={LAMP_SPILL}
        locations={[0, 0.45, 1]}
        style={styles.lampSpill}
        pointerEvents="none"
      />
      <View style={[styles.inner, compact && styles.innerCompact]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  frostWeb: {
    backgroundColor: FROST_WEB,
  },
  lampSpill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  inner: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[6],
    zIndex: 1,
  },
  innerCompact: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
});
