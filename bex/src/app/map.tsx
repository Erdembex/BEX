import { Redirect } from 'expo-router';

/** Harita özelliği kaldırıldı — eski derin linkler ana sayfaya yönlendirilir. */
export default function MapScreenRemoved() {
  return <Redirect href="/(tabs)/home" />;
}
