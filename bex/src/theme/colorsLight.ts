import type { ColorKey } from './colors';
import { BRAND_NAVY, brandNavyAlpha } from './brand';

/**
 * Açık mod — Passla marka paleti
 * Krem zemin · Safir metin/CTA · Altın vurgu yüzeyleri · Buz mavi bilgi
 */
export const LightColors: Record<ColorKey, string> = {
  primary: BRAND_NAVY,
  primaryLight: brandNavyAlpha(0.08),
  primaryDark: BRAND_NAVY,

  secondary: '#2E5A8A',
  accent: '#D4B86A',
  accentLight: 'rgba(212, 184, 106, 0.16)',
  accentDark: '#8A7024',

  iconPrimary: BRAND_NAVY,
  iconSecondary: '#2E5A8A',
  iconMuted: '#7A8490',
  iconSurface: '#F3EBD0',

  moneyGreen: '#2D6B4A',
  moneyGreenDark: '#1F4D35',
  moneyGreenLight: 'rgba(45, 107, 74, 0.1)',

  business: '#3D6A94',
  businessLight: 'rgba(168, 199, 232, 0.28)',
  businessDark: '#2A5070',

  background: '#F0EEE9',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAF8F5',
  card: '#FFFFFF',

  text: BRAND_NAVY,
  textPrimary: BRAND_NAVY,
  textMuted: '#5A6572',
  textSecondary: '#2A4568',
  textTertiary: '#7A8490',
  textInverse: '#F0EEE9',
  textOnPrimary: '#F0EEE9',
  textOnGold: BRAND_NAVY,

  border: '#DDD8CF',
  borderLight: '#EBE6DE',
  borderFocus: BRAND_NAVY,
  borderGold: 'rgba(212, 184, 106, 0.38)',

  success: '#2D6B4A',
  successLight: 'rgba(45, 107, 74, 0.1)',
  error: '#B53A45',
  errorLight: 'rgba(181, 58, 69, 0.08)',
  warning: '#8A7024',
  warningLight: 'rgba(212, 184, 106, 0.16)',
  info: '#4A6FA5',
  infoLight: 'rgba(168, 199, 232, 0.24)',

  difficultyEasy: '#2D6B4A',
  difficultyMedium: '#8A7024',
  difficultyHard: '#B53A45',

  overlay: brandNavyAlpha(0.5),
  overlayLight: 'rgba(212, 184, 106, 0.30)',

  transparent: 'transparent',
  white: '#FFFFFF',

  gradientBlue: '#E4EBF4',
  gradientGold: '#D4B86A',
  gradientMid: '#F0EEE9',
};
