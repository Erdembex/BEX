import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PasslaLogo } from '@/components/ui/PasslaLogo';

const SPLASH_BG = '#F0EEE9';

interface AppLaunchSplashProps {
  fontsLoaded: boolean;
}

/** Uygulama açılışında Passla logosu + yükleme göstergesi */
export function AppLaunchSplash({ fontsLoaded }: AppLaunchSplashProps) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8E4DC', SPLASH_BG, '#FAFAF8']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.heroFrame}>
        <View style={styles.heroRingOuter} />
        <View style={styles.heroRingInner} />
        <View style={styles.logoCard}>
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
        </View>
      </View>

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
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  heroFrame: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRingOuter: {
    position: 'absolute',
    width: '92%',
    height: '88%',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(5,31,69,0.08)',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  heroRingInner: {
    position: 'absolute',
    width: '78%',
    height: '74%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(5,31,69,0.12)',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  logoCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingVertical: 40,
    minWidth: 280,
  },
  logoImage: {
    width: 300,
    height: 98,
  },
  spinner: {
    marginTop: 40,
  },
});
