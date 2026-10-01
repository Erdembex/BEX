import React from 'react';
import { ImageBackground, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

const AUTH_LOGIN_WALL = require('../../../assets/branding/auth-wall-passla.webp');

/** Giriş ekranı — spreyle PASSLA yazılmış tuğla duvar. Yazı kutunun üstünde kalsın. */
export function AuthGlassBackground() {
  const { width, height } = useWindowDimensions();
  const lift = Math.round(height * 0.13);

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
      <ImageBackground
        source={AUTH_LOGIN_WALL}
        style={{ width, height: height + lift, marginTop: -lift }}
        resizeMode="cover"
        fadeDuration={0}
        {...(Platform.OS === 'android' ? { resizeMethod: 'scale' as const } : {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
