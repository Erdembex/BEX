import { Image, Platform } from 'react-native';

const AUTH_LOGIN_WALL = require('../../assets/branding/auth-login-wall.png');

let cached: Promise<boolean> | null = null;

/** Giriş duvar görselini önbelleğe al — çıkış sonrası boş/mavi flaşı azaltır. */
export function prefetchAuthLoginWall(): Promise<boolean> {
  if (!cached) {
    cached = (async () => {
      if (Platform.OS === 'web') {
        return false;
      }

      const resolveAssetSource = Image.resolveAssetSource;
      if (typeof resolveAssetSource !== 'function') {
        return false;
      }

      try {
        const src = resolveAssetSource(AUTH_LOGIN_WALL);
        if (!src?.uri) return false;
        return await Image.prefetch(src.uri).catch(() => false);
      } catch {
        return false;
      }
    })();
  }
  return cached;
}
