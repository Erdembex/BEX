import { Stack, Redirect, usePathname } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { buildLoginRedirect } from '@/lib/protectedRoutes';

export default function AdminLayout() {
  const { bexUser, firebaseUser, isInitialized } = useAuthStore();
  const pathname = usePathname();

  if (isInitialized && !firebaseUser) {
    return <Redirect href={buildLoginRedirect(pathname || '/(admin)/panel')} />;
  }

  if (bexUser && bexUser.role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="panel" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="verifications" />
      <Stack.Screen name="submissions" />
      <Stack.Screen name="subscriptions" />
      <Stack.Screen name="users" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="complaints" />
    </Stack>
  );
}
