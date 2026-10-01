import { Platform, Text, TextInput } from 'react-native';

/** Sistem “Çok büyük” yazı tipi — layout taşmasını sınırlar (iOS Dynamic Type + Android). */
export const MAX_FONT_SIZE_MULTIPLIER = 1.2;

/**
 * Tüm RN Text / TextInput için üst font ölçeği. `index.ts` açılışta bir kez çağrılır.
 */
export function installGlobalFontScalingLimits(): void {
  const textProto = Text as typeof Text & { defaultProps?: Record<string, unknown> };
  textProto.defaultProps = {
    ...textProto.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
  };

  const inputProto = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
  inputProto.defaultProps = {
    ...inputProto.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: MAX_FONT_SIZE_MULTIPLIER,
  };
}

/** @deprecated installGlobalFontScalingLimits kullan */
export function installAndroidReleaseUiFixes(): void {
  installGlobalFontScalingLimits();
}

/** Play AAB metin satırları — dikey harf kırılmasını kapatır. */
export const androidTextLayout = {
  includeFontPadding: false,
  textBreakStrategy: 'simple' as const,
};
