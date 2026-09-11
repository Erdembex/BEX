import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius, Spacing } from '@/theme';

type AuthGlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

const GLASS_BORDER = 'rgba(255, 255, 255, 0.42)';
/** Blur üstü hafif lacivert — graffiti arkadan okunmayı engellemesin */
const FROST_OVERLAY = 'rgba(5, 31, 69, 0.52)';

/** Buzlu cam auth kartı — blur + yarı saydam katman; yazılar net okunur. */
export function AuthGlassCard({ children, style, compact = false }: AuthGlassCardProps) {
  const inner = (
    <View style={[styles.inner, compact && styles.innerCompact]}>{children}</View>
  );

  return (
    <View style={[styles.card, style]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFillObject, styles.frostWeb]} pointerEvents="none" />
      ) : (
        <>
          <BlurView
            intensity={Platform.OS === 'ios' ? 55 : 64}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
            {...(Platform.OS === 'android'
              ? { experimentalBlurMethod: 'dimezisBlurView' as const, blurReductionFactor: 3 }
              : {})}
          />
          <View style={styles.frostOverlay} pointerEvents="none" />
        </>
      )}
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'] + 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: FROST_OVERLAY,
    position: 'relative',
  },
  frostOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: FROST_OVERLAY,
  },
  frostWeb: {
    backgroundColor: 'rgba(5, 31, 69, 0.78)',
  },
  inner: {
    padding: Spacing[7],
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  innerCompact: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
});
