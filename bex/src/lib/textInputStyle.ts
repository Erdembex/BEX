import { Platform, TextStyle } from 'react-native';

/** E-posta, arama ve mesaj alanlarında descender kırpılmasını önler */
export const readableTextInputStyle: TextStyle = {
  textAlign: 'left',
  textAlignVertical: 'center',
  ...(Platform.OS === 'android'
    ? {
        includeFontPadding: false,
        textBreakStrategy: 'simple' as const,
        lineHeight: 22,
        paddingTop: 0,
        paddingBottom: 0,
      }
    : {}),
};

/** Web TextInput — tarayıcı outline'ını kapatır */
export const webTextInputStyle: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', cursor: 'text' } as unknown as TextStyle)
    : undefined;

export const textInputPaddingVertical = Platform.select({
  android: 10,
  ios: 14,
  default: 12,
}) as number;
