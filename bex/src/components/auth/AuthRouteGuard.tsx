import { useEffect, useRef } from 'react';
import { router, usePathname, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { buildLoginRedirect, isAuthRequiredPath } from '@/lib/protectedRoutes';

/** Oturumsuz kullanıcıyı korumalı rotalardan login'e yönlendirir (deep link dahil). */
export function AuthRouteGuard() {
  const { firebaseUser, isInitialized } = useAuthStore();
  const pathname = usePathname();
  const segments = useSegments();
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isInitialized || firebaseUser) {
      lastRedirectRef.current = null;
      return;
    }

    const path = pathname || '/';
    if (!isAuthRequiredPath(path, segments)) {
      lastRedirectRef.current = null;
      return;
    }

    if (lastRedirectRef.current === path) return;
    lastRedirectRef.current = path;

    router.replace(buildLoginRedirect(path));
  }, [firebaseUser, isInitialized, pathname, segments]);

  return null;
}
