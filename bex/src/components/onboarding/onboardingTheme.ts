import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

/** Referans tasarım genişliği; AAB'de modül yüklenirken ölçü alınmaz — hook kullan. */
const REFERENCE_WIDTH = 322;

/** Giriş duvarı ile aynı marka laciverti (#17264F). */
export const ONBOARDING_BG = ['#1A2F58', '#17264F', '#141F3F'] as const;

export const ONBOARDING_COLORS = {
  navy: '#17264F',
  title: '#FFFFFF',
  body: '#D1DAEF',
  slogan: '#9BAAC8',
  progressActive: '#FFFFFF',
  progressInactive: 'rgba(255, 255, 255, 0.24)',
  buttonFill: '#FFFFFF',
  buttonText: '#17264F',
  link: '#E8EDFA',
} as const;

export function useOnboardingTheme() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => {
    const scale = Math.min(Math.max(width, 320) / REFERENCE_WIDTH, 1.35);
    const rs = (size: number) => Math.round(size * scale);
    const IS_COMPACT_HEIGHT = height < 720;
    return { rs, IS_COMPACT_HEIGHT, width, height, scale };
  }, [width, height]);
}
