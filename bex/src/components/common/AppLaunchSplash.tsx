import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const APP_ICON = require('../../../assets/icon.png');

/** Expo Go ile aynı: beyaz zemin, yuvarlatılmış uygulama ikonu, altta Passla */
export function AppLaunchSplash() {
  const { width: screenW, height: screenH } = Dimensions.get('screen');
  const iconSize = Math.min(screenW * 0.34, 132);
  const iconRadius = Math.round(iconSize * 0.223);

  return (
    <View style={[styles.container, { width: screenW, height: screenH }]}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <View
          style={[
            styles.iconShadow,
            {
              width: iconSize,
              height: iconSize,
              borderRadius: iconRadius,
            },
          ]}
        >
          <Image
            source={APP_ICON}
            style={{ width: iconSize, height: iconSize, borderRadius: iconRadius }}
            resizeMode="cover"
            {...(Platform.OS === 'android' ? { resizeMethod: 'scale' as const } : {})}
            accessibilityRole="image"
            accessibilityLabel="Passla"
          />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Passla
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '12%',
  },
  iconShadow: {
    backgroundColor: '#17264F',
    shadowColor: '#17264F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
    overflow: 'hidden',
  },
  title: {
    marginTop: 22,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: '#0F172A',
    ...(Platform.OS === 'android'
      ? { includeFontPadding: false, textBreakStrategy: 'simple' as const }
      : {}),
  },
});
