import { Platform, TextStyle } from 'react-native';

/** E-posta, arama ve mesaj alanlarında descender kırpılmasını önler */
export const readableTextInputStyle: TextStyle = {
  textAlign: 'left',
  textAlignVertical: 'center',
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
};

/** Web TextInput — tarayıcı outline'ını kapatır */
export const webTextInputStyle: TextStyle | undefined =
  Platform.OS === 'web'
    ? ({ outlineStyle: 'none', cursor: 'text' } as unknown as TextStyle)
    : undefined;

export const textInputPaddingVertical = Platform.select({
  android: 12,
  ios: 14,
  default: 12,
}) as number;
