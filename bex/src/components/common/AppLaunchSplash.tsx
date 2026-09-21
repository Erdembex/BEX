import { StyleSheet, View, Image } from 'react-native';

const SPLASH = require('../../../assets/splash.png');

interface AppLaunchSplashProps {
  fontsLoaded?: boolean;
}

/** Native splash ile aynı görsel — font/yüklenme sırasında kesintisiz geçiş */
export function AppLaunchSplash(_props: AppLaunchSplashProps) {
  return (
    <View style={styles.container}>
      <Image
        source={SPLASH}
        style={styles.image}
        resizeMode="cover"
        accessibilityRole="image"
        accessibilityLabel="Passla"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051F45',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
