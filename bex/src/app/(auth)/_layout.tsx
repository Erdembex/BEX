import { Stack } from 'expo-router';
import { useThemeColors } from '@/theme';

export default function AuthLayout() {
  const Colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="email-verification" />
      <Stack.Screen name="phone-verification" />
      <Stack.Screen name="banned" />
    </Stack>
  );
}
