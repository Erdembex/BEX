import { useMemo } from 'react';
import { createTheme } from '@shopify/restyle';
import { Colors as DarkColors } from '@/theme/colors';
import { LightColors } from '@/theme/colorsLight';
import type { ColorKey } from '@/theme/colors';
import { getTheme } from '@/theme/restyle';
import { useThemeColors } from '@/theme';
import { useThemeStore } from '@/store/themeStore';
import type { TextStyle, ViewStyle } from 'react-native';

/** Takas & cüzdan — aktif uygulama temasına göre üretilir */
export function getTradeTheme(palette: Record<ColorKey, string>) {
  const base = getTheme(palette);
  /** Koyu modda primary altın ton — CTA ve vurgular */
  const isDark = palette.textOnPrimary === '#031528';

  return createTheme({
    ...base,
    colors: {
      ...base.colors,
      tradePrimary: palette.primary,
      tradePrimaryDark: palette.primaryDark,
      tradePrimaryLight: palette.primaryLight,
      tradePrimaryBorder: palette.borderGold,
      tradePrimaryText: palette.textOnPrimary,
      tradeCta: isDark ? palette.accent : palette.primary,
      tradeCtaText: isDark ? palette.textOnGold : palette.textOnPrimary,
      tradeHighlight: isDark ? palette.accent : palette.secondary,
      tradeAccent: palette.accent,
      tradeAccentLight: palette.accentLight,
      tradeAccentBorder: palette.borderGold,
      tradeMoneyGreen: palette.moneyGreen,
      /** Modal / panel zemin — koyu modda bir ton daha açık */
      tradePanel: isDark ? palette.card : palette.surface,
      /** Kupon kartları — arka plandan ayrışır */
      tradeCard: isDark ? palette.surfaceSecondary : palette.surfaceSecondary,
      tradeCardSelected: isDark ? 'rgba(212, 184, 106, 0.24)' : palette.accentLight,
      tradeCardSelectedBorder: palette.accent,
      /** İkincil metin — textMuted yerine daha okunaklı */
      tradeMuted: palette.textSecondary,
      /** Form alanları — krem zemin + koyu metin */
      tradeInputBg: isDark ? '#F5F3EE' : palette.surface,
      tradeInputText: isDark ? palette.textInverse : palette.text,
      tradeInputBorder: isDark ? '#B8C9DC' : palette.border,
      /** Bilgi kutusu */
      tradeInfoBg: isDark ? 'rgba(143, 175, 212, 0.10)' : palette.infoLight,
      tradeInfoText: palette.textSecondary,
    },
    borderRadii: {
      ...base.borderRadii,
      xs: 4,
      sm: 6,
      md: 8,
      lg: 10,
      xl: 12,
      '2xl': 14,
    },
  });
}

export type TradeTheme = ReturnType<typeof getTradeTheme>;

export function getTradeInputStyle(theme: TradeTheme): TextStyle {
  return {
    backgroundColor: theme.colors.tradeInputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.tradeInputBorder,
    padding: 12,
    color: theme.colors.tradeInputText,
    fontSize: 15,
  };
}

export function getTradeSheetStyle(theme: TradeTheme): ViewStyle {
  return {
    width: '100%',
    backgroundColor: theme.colors.tradePanel,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  };
}

/** Aktif uygulama temasına göre takas ekranı restyle teması */
export function useTradeTheme() {
  const colors = useThemeColors();
  return useMemo(() => getTradeTheme(colors), [colors]);
}

/** Modül düzeyi referanslar — tema store ile senkron kalır */
let activeTradeTheme = getTradeTheme(DarkColors);

useThemeStore.subscribe((state) => {
  activeTradeTheme = getTradeTheme(state.mode === 'light' ? LightColors : DarkColors);
});

export const tradeTheme: TradeTheme = new Proxy({} as TradeTheme, {
  get(_target, prop, receiver) {
    return Reflect.get(activeTradeTheme, prop, receiver);
  },
});
