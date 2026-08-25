import 'react-native-gesture-handler';
import { useEffect, useMemo, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useLocaleStore } from '@/store/localeStore';
import { useThemeColors, useIsDarkMode, getTheme } from '@/theme';
import { initAppCheck } from '@/lib/appCheck';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { BackendStatusBanner } from '@/components/common/BackendStatusBanner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastProvider } from '@/components/common/Toast';
import { useNotifications } from '@/hooks/useNotifications';
import { PendingFeedbackGate } from '@/components/feedback/PendingFeedbackGate';
import { useAppFonts } from '@/hooks/useAppFonts';
import { AppLaunchSplash } from '@/components/common/AppLaunchSplash';
import { useSavedListingsStore } from '@/store/savedListingsStore';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* Expo Go veya tekrar çağrıda sessizce yoksay */
});

export default function RootLayout() {
  const { setFirebaseUser, setBexUser, setInitialized, isInitialized, firebaseUser } =
    useAuthStore();
  const hydrateSavedListings = useSavedListingsStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const Colors = useThemeColors();
  const isDark = useIsDarkMode();
  const theme = useMemo(() => getTheme(Colors), [Colors]);
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const fontsLoaded = useAppFonts();

  useNotifications();

  useEffect(() => {
    initAppCheck();
    hydrateTheme();
    hydrateLocale();
  }, [hydrateTheme, hydrateLocale]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { session, bexUser } = await authService.restoreSession();
        if (cancelled) return;
        setFirebaseUser(session);
        setBexUser(bexUser);
      } catch (err) {
        console.error('[RootLayout] Oturum geri yüklenemedi:', err);
        if (!cancelled) {
          setFirebaseUser(null);
          setBexUser(null);
        }
      } finally {
        if (!cancelled) setInitialized(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setFirebaseUser, setBexUser, setInitialized]);

  useEffect(() => {
    hydrateSavedListings(firebaseUser?.uid ?? null);
  }, [firebaseUser?.uid, hydrateSavedListings]);

  const appReady = isInitialized && fontsLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  if (!appReady) {
    return <AppLaunchSplash fontsLoaded={fontsLoaded} />;
  }

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <ThemeProvider theme={theme}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ErrorBoundary>
            <ToastProvider>
              <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={Colors.background} />
              <OfflineBanner />
              <BackendStatusBanner />
              <PendingFeedbackGate />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(business)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="task" />
                <Stack.Screen name="business" />
                <Stack.Screen name="complaint" />
                <Stack.Screen name="application" />
                <Stack.Screen name="notifications/index" />
                <Stack.Screen name="setup-guide" />
                <Stack.Screen name="expo-test-guide" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="delete-account" />
                <Stack.Screen name="blocked-users" />
                <Stack.Screen name="about" />
                <Stack.Screen name="leaderboard" />
                <Stack.Screen name="map" />
                <Stack.Screen name="swap-chat/[offerId]" />
                <Stack.Screen name="search" options={{ presentation: 'modal' }} />
                <Stack.Screen name="user/[id]" />
              </Stack>
            </ToastProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function createStyles(_Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
  });
}
