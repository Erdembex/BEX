import { createTheme } from '@shopify/restyle';
import { Colors } from './colors';
import type { ColorKey } from './colors';
import { FontFamily, FontSize } from './typography';

function buildThemeColors(palette: Record<ColorKey, string>) {
  return {
    primary: palette.primary,
    secondary: palette.secondary,
    background: palette.background,
    surface: palette.surface,
    border: palette.border,
    text: palette.text,
    textMuted: palette.textMuted,
    white: palette.white,
    transparent: palette.transparent,
    error: palette.error,
    errorLight: palette.errorLight,
    primaryLight: palette.primaryLight,
    textOnPrimary: palette.textOnPrimary,
    textOnGold: palette.textOnGold,
    accent: palette.accent,
    success: palette.success,
    moneyGreen: palette.moneyGreen,
    textSecondary: palette.textSecondary,
  };
}

export const theme = createTheme({
  colors: buildThemeColors(Colors),
  spacing: {
    none: 0,
    xs: 4,
    s: 8,
    sm: 8,
    m: 16,
    md: 16,
    l: 20,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },
  borderRadii: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 28,
    full: 9999,
  },
  textVariants: {
    defaults: {
      color: 'text',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    headingLarge: {
      color: 'text',
      fontFamily: FontFamily.bold,
      fontSize: FontSize['2xl'],
      letterSpacing: -0.4,
    },
    headingMedium: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.xl,
    },
    headingSmall: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.lg,
    },
    body: {
      color: 'text',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    bodyMuted: {
      color: 'textMuted',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    caption: {
      color: 'textMuted',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.xs,
    },
    label: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonPrimary: {
      color: 'textOnPrimary',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonSecondary: {
      color: 'textOnGold',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonOutline: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonDanger: {
      color: 'textOnPrimary',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
  },
});

export type Theme = typeof theme;

/**
 * Verilen palete (koyu/açık) göre restyle teması üretir. `ThemeProvider`'a
 * dinamik olarak geçirilerek `@shopify/restyle` bileşenlerinin (Box, Text)
 * tema değişince anında güncellenmesini sağlar.
 */
export function getTheme(palette: Record<ColorKey, string>): Theme {
  return createTheme({
    ...theme,
    colors: buildThemeColors(palette),
  });
}
