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

/** Hafif buzlu cam — tuğla görünür, yazı okunur. Mat dolgu yok. */
const FROST_TINT = 'rgba(255, 255, 255, 0.38)';
const LAMP_SPILL = ['rgba(255, 220, 160, 0.42)', 'rgba(255, 232, 190, 0.08)', 'rgba(255, 255, 255, 0)'] as const;

export function AuthFrostCard({ children, style, compact = false }: AuthFrostCardProps) {
  return (
    <View style={[styles.card, style]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webFrost]} pointerEvents="none" />
      ) : (
        <>
          <BlurView
            intensity={Platform.OS === 'android' ? 48 : 56}
            tint="light"
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            {...(Platform.OS === 'android'
              ? { experimentalBlurMethod: 'dimezisBlurView' as const }
              : {})}
          />
          <View style={[StyleSheet.absoluteFill, styles.frostTint]} pointerEvents="none" />
        </>
      )}
      <LinearGradient
        colors={LAMP_SPILL}
        locations={[0, 0.4, 1]}
        style={styles.lampSpill}
        pointerEvents="none"
      />
      <View style={[styles.inner, compact && styles.innerCompact]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#0B1630',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  frostTint: {
    backgroundColor: FROST_TINT,
  },
  webFrost: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  lampSpill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 72,
  },
  inner: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    zIndex: 1,
  },
  innerCompact: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
});
