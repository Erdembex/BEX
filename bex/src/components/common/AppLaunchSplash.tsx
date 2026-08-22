import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { PasslaLogo } from '@/components/ui/PasslaLogo';

const SPLASH_BG = '#F0EEE9';

interface AppLaunchSplashProps {
  fontsLoaded: boolean;
}

/** Uygulama açılışında Passla logosu + yükleme göstergesi */
export function AppLaunchSplash({ fontsLoaded }: AppLaunchSplashProps) {
  return (
    <View style={styles.container}>
      {fontsLoaded ? (
        <PasslaLogo size="lg" centered showTagline />
      ) : (
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel="Passla"
        />
      )}
      <ActivityIndicator size="small" color="#051F45" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logoImage: {
    width: 220,
    height: 120,
  },
  spinner: {
    marginTop: 32,
  },
});
