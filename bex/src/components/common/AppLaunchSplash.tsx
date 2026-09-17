import { StyleSheet, View, Image } from 'react-native';
import { BRAND_NAVY } from '@/theme/brand';

const MARK_WHITE = require('../../../assets/branding/passla-mark-white.png');

interface AppLaunchSplashProps {
  fontsLoaded?: boolean;
}

/** Uygulama açılışında lacivert zemin + ortada beyaz SS işareti */
export function AppLaunchSplash(_props: AppLaunchSplashProps) {
  return (
    <View style={styles.container}>
      <Image
        source={MARK_WHITE}
        style={styles.mark}
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
  mark: {
    width: 200,
    height: 200,
  },
});
