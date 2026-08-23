import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radius, Spacing } from '@/theme';

type AuthGlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const GLASS_BORDER = 'rgba(255, 255, 255, 0.16)';
const GLASS_FILL = 'rgba(255, 255, 255, 0.07)';
const GLASS_FILL_ANDROID = 'rgba(5, 31, 69, 0.72)';

/** Buzlu cam auth kartı — login / register */
export function AuthGlassCard({ children, style }: AuthGlassCardProps) {
  const inner = (
    <View style={[styles.inner, Platform.OS === 'android' && styles.innerAndroid]}>
      {children}
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.card, styles.webFallback, style]}>
        {inner}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <BlurView intensity={Platform.OS === 'ios' ? 48 : 32} tint="dark" style={styles.blur}>
        {inner}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'] + 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: Platform.OS === 'android' ? GLASS_FILL_ANDROID : 'transparent',
  },
  webFallback: {
    backgroundColor: GLASS_FILL_ANDROID,
  },
  blur: {
    flex: 1,
  },
  inner: {
    padding: Spacing[7],
    backgroundColor: GLASS_FILL,
  },
  innerAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
