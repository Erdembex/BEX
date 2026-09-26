import { PixelRatio, TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

/**
 * Cihazın yazı boyutu ayarı (Android'de "Huge" seçeneği 2.0'a kadar çıkar).
 * React Native her fontSize'ı bu katsayıyla çarpar; tasarımın taşıyabileceği
 * üst sınırı aşan kısmı burada geri alıyoruz, yoksa isimler dikey kırılıyor,
 * başlıklar kesiliyor ve kartlar taşıyor.
 */
const MAX_FONT_SCALE = 1.2;
const deviceFontScale = PixelRatio.getFontScale();
const fontScaleCompensation =
  deviceFontScale > MAX_FONT_SCALE ? MAX_FONT_SCALE / deviceFontScale : 1;

/** Ekranda görünecek boyutu MAX_FONT_SCALE ile sınırlar. */
export function scaledFontSize(size: number): number {
  return Math.round(size * fontScaleCompensation * 100) / 100;
}

export const FontSize = {
  xs: scaledFontSize(11),
  sm: scaledFontSize(13),
  base: scaledFontSize(15),
  md: scaledFontSize(16),
  lg: scaledFontSize(18),
  xl: scaledFontSize(20),
  '2xl': scaledFontSize(24),
  '3xl': scaledFontSize(28),
  '4xl': scaledFontSize(32),
  '5xl': scaledFontSize(40),
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const Typography = {
  displayLarge: {
    fontFamily: FontFamily.extraBold,
    fontSize: FontSize['4xl'],
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    letterSpacing: -0.8,
  } as TextStyle,

  displayMedium: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    letterSpacing: -0.6,
  } as TextStyle,

  headingLarge: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * LineHeight.snug,
    letterSpacing: -0.4,
  } as TextStyle,

  headingMedium: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.snug,
    letterSpacing: -0.2,
  } as TextStyle,

  headingSmall: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: FontSize.lg * LineHeight.snug,
    letterSpacing: -0.1,
  } as TextStyle,

  bodyLarge: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.relaxed,
  } as TextStyle,

  bodyMedium: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.relaxed,
  } as TextStyle,

  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  } as TextStyle,

  labelLarge: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: 0.1,
  } as TextStyle,

  labelSmall: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } as TextStyle,

  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.normal,
  } as TextStyle,
} as const;
