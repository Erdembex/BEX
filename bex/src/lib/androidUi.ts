import { Platform, Text, TextInput } from 'react-native';

/**
 * Expo Go ≠ Play AAB: release APK'da Android metin ölçümü ve erişilebilirlik
 * fontScale layout'u patlatır. Uygulama açılışında bir kez uygulanır.
 */
export function installAndroidReleaseUiFixes(): void {
  if (Platform.OS !== 'android') return;

  const textProto = Text as typeof Text & { defaultProps?: Record<string, unknown> };
  textProto.defaultProps = {
    ...textProto.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.2,
  };

  const inputProto = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
  inputProto.defaultProps = {
    ...inputProto.defaultProps,
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.2,
  };
}

/** Play AAB metin satırları — dikey harf kırılmasını kapatır. */
export const androidTextLayout = {
  includeFontPadding: false,
  textBreakStrategy: 'simple' as const,
};
