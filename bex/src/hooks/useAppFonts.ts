import { useEffect } from 'react';
import { useFonts } from 'expo-font';

export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular: require('../../assets/fonts/Inter_400Regular.ttf'),
    Inter_500Medium: require('../../assets/fonts/Inter_500Medium.ttf'),
    Inter_600SemiBold: require('../../assets/fonts/Inter_600SemiBold.ttf'),
    Inter_700Bold: require('../../assets/fonts/Inter_700Bold.ttf'),
    Inter_800ExtraBold: require('../../assets/fonts/Inter_800ExtraBold.ttf'),
  });

  useEffect(() => {
    if (error) {
      console.error('[useAppFonts] Inter yüklenemedi — AAB layout bozulabilir:', error);
    }
  }, [error]);

  // Expo Go: hata olsa bile devam (Metro yeniden dene). Release AAB: font hazır olmadan UI açma.
  if (__DEV__) {
    return loaded || !!error;
  }
  return loaded;
}
