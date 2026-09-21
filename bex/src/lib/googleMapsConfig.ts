import { Platform } from 'react-native';

export function getGoogleMapsApiKey(): string {
  return process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? '';
}

/** Android production/internal build: Google karoları için key zorunlu. */
export function isAndroidMapsKeyConfigured(): boolean {
  if (Platform.OS !== 'android') return true;
  return getGoogleMapsApiKey().length > 0;
}
