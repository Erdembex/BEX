import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useThemeColors } from '@/theme';
import { prefetchAuthLoginWall } from '@/lib/prefetchAuthLoginWall';

export default function AuthLayout() {
  const Colors = useThemeColors();

  useEffect(() => {
    void prefetchAuthLoginWall();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
        animationDuration: 150,
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="phone-verification" />
      <Stack.Screen name="banned" />
    </Stack>
  );
}
