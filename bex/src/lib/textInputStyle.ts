import { Platform, TextStyle } from 'react-native';

/**
 * Tek satır kutular: lineHeight metni (özellikle iOS) kutunun altına iter.
 * Dikey ortalama için padding sıfır, hizayı kutu satırı verir.
 */
export const readableTextInputStyle: TextStyle = {
  textAlign: 'left',
  textAlignVertical: 'center',
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  ...(Platform.OS === 'android'
    ? {
        includeFontPadding: false,
        textBreakStrategy: 'simple' as const,
      }
    : {}),
};

/** Web TextInput — tarayıcı outline'ını kapatır */
export const webTextInputStyle: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', cursor: 'text' } as unknown as TextStyle)
    : undefined;

/** Tek satır alanlarda ekstra dikey boşluk yazıyı aşağı kaydırır. */
export const textInputPaddingVertical = 0;
