import React from 'react';
import { ImageBackground, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

const AUTH_LOGIN_WALL = require('../../../assets/branding/auth-login-wall.png');

/** Giriş ekranı — graffiti üstte, alt gri yol bandı form için */
export function AuthGlassBackground() {
  const { width, height } = useWindowDimensions();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <ImageBackground
        source={AUTH_LOGIN_WALL}
        style={{ width, height }}
        resizeMode="cover"
        fadeDuration={0}
        {...(Platform.OS === 'android' ? { resizeMethod: 'scale' as const } : {})}
      />
    </View>
  );
}
