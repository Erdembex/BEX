import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { createThemedStyles, useThemeColors } from '@/theme';

export default function Index() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { firebaseUser, bexUser, isInitialized, setBexUser, signOut } = useAuthStore();

  useEffect(() => {
    if (!isInitialized || !firebaseUser || bexUser) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const profile = await authService.getUserDocument(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        if (cancelled) return;
        if (profile) {
          setBexUser(profile);
          return;
        }
      } catch {
        // Profil yüklenemedi — oturumu temizle, sonsuz spinner olmasın
      }
      if (!cancelled) {
        await authService.logout();
        signOut();
      }
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isInitialized, firebaseUser, bexUser, setBexUser, signOut]);

  if (!isInitialized) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </Screen>
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Profil henüz yükleniyor (kayıt/giriş sonrası)
  if (!bexUser) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </Screen>
    );
  }

  if (bexUser.isBanned) {
    return <Redirect href="/(auth)/banned" />;
  }

  if (bexUser.role === 'business') {
    return <Redirect href="/(business)/panel" />;
  }

  if (bexUser.role === 'admin') {
    return <Redirect href="/(admin)/panel" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const useScreenStyles = createThemedStyles((Colors) => ({
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
