export const Colors = {
  // Passla koyu mod — safir gece, lila etkileşim, altın ödül, krem metin
  primary: '#F2E5FF',
  primaryLight: 'rgba(242, 229, 255, 0.12)',
  primaryDark: '#D4C8F0',

  secondary: '#A8C7E8',
  accent: '#D4B86A',
  accentLight: 'rgba(212, 184, 106, 0.16)',
  accentDark: '#B89A4A',

  moneyGreen: '#6BBF8A',
  moneyGreenDark: '#4A9968',
  moneyGreenLight: 'rgba(107, 191, 138, 0.14)',

  business: '#A8C7E8',
  businessLight: 'rgba(168, 199, 232, 0.16)',
  businessDark: '#7A9BB8',

  background: '#031528',
  surface: '#0A2342',
  surfaceSecondary: '#0F2D50',
  card: '#0C2848',

  text: '#F0EEE9',
  textPrimary: '#F0EEE9',
  textMuted: '#9BB5D0',
  textSecondary: '#C5D4E3',
  textTertiary: '#7A9BB8',
  textInverse: '#031528',
  textOnPrimary: '#031528',
  textOnGold: '#031528',

  border: '#1A3555',
  borderLight: '#122D52',
  borderFocus: '#F2E5FF',
  borderGold: 'rgba(212, 184, 106, 0.38)',

  success: '#6BBF8A',
  successLight: 'rgba(107, 191, 138, 0.14)',
  error: '#E8929A',
  errorLight: 'rgba(232, 146, 154, 0.14)',
  warning: '#D4B86A',
  warningLight: 'rgba(212, 184, 106, 0.14)',
  info: '#A8C7E8',
  infoLight: 'rgba(168, 199, 232, 0.14)',

  difficultyEasy: '#6BBF8A',
  difficultyMedium: '#D4B86A',
  difficultyHard: '#E8929A',

  overlay: 'rgba(3, 21, 40, 0.88)',
  overlayLight: 'rgba(242, 229, 255, 0.06)',

  transparent: 'transparent',
  white: '#F0EEE9',

  gradientBlue: '#0F2D50',
  gradientGold: '#D4B86A',
  gradientMid: '#031528',
} as const;

export type ColorKey = keyof typeof Colors;
