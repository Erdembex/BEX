import { useCallback } from 'react';
import { Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { showLoginRequiredAlert } from '@/lib/loginRequiredPrompt';

export function useRequireAuth() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const isAuthenticated = !!firebaseUser;

  const promptLogin = useCallback((returnTo?: Href) => {
    showLoginRequiredAlert(returnTo);
  }, []);

  const requireAuth = useCallback(
    (onAuthed: () => void, returnTo?: Href) => {
      if (isAuthenticated) {
        onAuthed();
        return true;
      }
      promptLogin(returnTo);
      return false;
    },
    [isAuthenticated, promptLogin]
  );

  return { isAuthenticated, requireAuth, promptLogin };
}
