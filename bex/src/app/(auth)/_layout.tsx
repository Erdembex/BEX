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
      <Stack.Screen name="onboarding" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="register" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="forgot-password" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="reset-password" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="email-verification" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="phone-verification" options={{ contentStyle: { backgroundColor: '#051F45' } }} />
      <Stack.Screen name="banned" />
    </Stack>
  );
}
