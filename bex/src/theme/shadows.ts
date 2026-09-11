import { useMemo } from 'react';
import { BRAND_NAVY } from './brand';
import { useIsDarkMode } from './useThemeColors';

const darkShadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 4,
  },
  primary: {
    shadowColor: '#D4B86A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 1,
  },
} as const;

const lightShadows = {
  sm: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  primary: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export type ThemeShadows = typeof darkShadows | typeof lightShadows;

export function useThemeShadow(): ThemeShadows {
  const isDark = useIsDarkMode();
  return useMemo(() => (isDark ? darkShadows : lightShadows), [isDark]);
}

/** @deprecated useThemeShadow() tercih et */
export const Shadow = darkShadows;
