import { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { BRAND_NAVY } from '@/theme/brand';

const MARK_WHITE = require('../../../assets/branding/passla-mark-white.png');

interface AppLaunchSplashProps {
  fontsLoaded?: boolean;
}

/** Uygulama açılışında lacivert zemin + ortada beyaz SS işareti */
export function AppLaunchSplash(_props: AppLaunchSplashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, scale]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.markWrap, { opacity, transform: [{ scale }] }]}>
        <Image
          source={MARK_WHITE}
          style={styles.mark}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Passla"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 220,
    height: 220,
  },
});
