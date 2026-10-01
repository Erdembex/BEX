import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';

/** Marka laciverti — auth / adaptive icon ile aynı */
const BRAND_NAVY = '#17264F';

const SS_LOGO = require('../../../assets/branding/splash-ss-white.png');
const LOGO_ASPECT = 2400 / 1403;

/** Açılış: koyu mavi zemin, ortada SS wordmark (splash-ss-white) */
export function AppLaunchSplash() {
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width * 0.52, 268);
  const logoHeight = Math.round(logoWidth / LOGO_ASPECT);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image
        source={SS_LOGO}
        style={{ width: logoWidth, height: logoHeight }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />
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
});
