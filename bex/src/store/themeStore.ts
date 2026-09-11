import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = '@bex/theme_mode';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  isHydrated: false,

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {
      // sessiz — bir sonraki açılışta varsayılana döner
    });
  },

  toggleMode: () => {
    const next: ThemeMode = get().mode === 'dark' ? 'light' : 'dark';
    get().setMode(next);
  },

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        set({ mode: saved });
      }
    } catch {
      // sessiz — varsayılan koyu mod kalır
    } finally {
      set({ isHydrated: true });
    }
  },
}));
