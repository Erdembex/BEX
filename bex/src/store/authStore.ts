import { create } from 'zustand';
import { BexUser } from '../types';
import type { AuthSession } from '../features/auth/authTypes';

interface AuthState {
  /** REST oturumu — alan adı geriye dönük uyumluluk için korunuyor */
  firebaseUser: AuthSession | null;
  bexUser: BexUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  setFirebaseUser: (user: AuthSession | null) => void;
  setBexUser: (user: BexUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  bexUser: null,
  isLoading: false,
  isInitialized: false,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setBexUser: (user) => set({ bexUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),

  signOut: () => {
    set({ firebaseUser: null, bexUser: null, isLoading: false });
  },
}));

export type { AuthSession };
