import { BRAND_GOLD, BRAND_GOLD_AMBER, BRAND_GOLD_MID, BRAND_NAVY } from './brand';

export const Colors = {
  // Passla koyu mod — derin gece mavisi, altın etkileşim, krem metin
  primary: BRAND_GOLD_MID,
  primaryLight: 'rgba(196, 160, 84, 0.14)',
  primaryDark: BRAND_GOLD_AMBER,

  secondary: '#8FAFD4',
  accent: BRAND_GOLD,
  accentLight: 'rgba(212, 184, 106, 0.16)',
  accentDark: '#B89A4A',

  iconPrimary: BRAND_GOLD_MID,
  iconSecondary: '#8FAFD4',
  iconMuted: '#6A849E',
  iconSurface: 'rgba(231, 198, 99, 0.12)',

  moneyGreen: '#6BBF8A',
  moneyGreenDark: '#4A9968',
  moneyGreenLight: 'rgba(107, 191, 138, 0.14)',

  business: '#8FAFD4',
  businessLight: 'rgba(143, 175, 212, 0.12)',
  businessDark: '#6A8FAF',

  background: '#010810',
  surface: '#030F1A',
  surfaceSecondary: '#051422',
  card: '#040E18',

  text: '#F0EEE9',
  textPrimary: '#F0EEE9',
  textMuted: '#8FA8C4',
  textSecondary: '#B8C9DC',
  textTertiary: '#6A849E',
  textInverse: '#031528',
  textOnPrimary: '#031528',
  textOnGold: '#031528',

  border: '#0A1826',
  borderLight: '#061018',
  borderFocus: BRAND_GOLD_MID,
  borderGold: 'rgba(212, 184, 106, 0.38)',

  success: '#6BBF8A',
  successLight: 'rgba(107, 191, 138, 0.14)',
  error: '#C95A62',
  errorLight: 'rgba(201, 90, 98, 0.14)',
  warning: '#D4B86A',
  warningLight: 'rgba(212, 184, 106, 0.14)',
  info: '#8FAFD4',
  infoLight: 'rgba(143, 175, 212, 0.12)',

  difficultyEasy: '#6BBF8A',
  difficultyMedium: '#D4B86A',
  difficultyHard: '#C95A62',

  overlay: 'rgba(1, 8, 16, 0.94)',
  overlayLight: 'rgba(212, 184, 106, 0.10)',

  transparent: 'transparent',
  white: '#F0EEE9',

  gradientBlue: '#051422',
  gradientGold: '#D4B86A',
  gradientMid: '#010810',
} as const;

/** Marka laciverti — buton, logo, açık mod metin (arka plan değil). */
export { BRAND_NAVY };

export type ColorKey = keyof typeof Colors;
