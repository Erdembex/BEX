import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { initialWindowMetrics } from 'react-native-safe-area-context';

const SPLASH_LOGO = require('../../../assets/branding/splash-ss-white.png');
const LOGO_ASPECT = 2400 / 1403;

const NAVY = '#17264F';

function appVersion(): string {
  return Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.2';
}

/** SS fiziksel ekranın tam ortasında; yüklenme ve sürüm altta */
export function AppLaunchSplash() {
  const { width: screenW, height: screenH } = Dimensions.get('screen');
  const bottomInset = initialWindowMetrics?.insets.bottom ?? 0;
  const version = appVersion();

  const logoWidth = Math.min(screenW * 0.62, 360);
  const logoHeight = logoWidth / LOGO_ASPECT;

  return (
    <View style={[styles.container, { width: screenW, height: screenH }]}>
      <Image
        source={SPLASH_LOGO}
        style={{
          position: 'absolute',
          top: screenH / 2 - logoHeight / 2,
          left: screenW / 2 - logoWidth / 2,
          width: logoWidth,
          height: logoHeight,
        }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />

      <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, 28) + 24 }]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text style={styles.version}>{version}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: NAVY,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    gap: 12,
  },
  version: {
    fontSize: 13,
    letterSpacing: 0.3,
    color: 'rgba(232, 237, 250, 0.72)',
  },
});
