import { Platform, TextStyle } from 'react-native';

/** E-posta, arama ve mesaj alanlarında descender kırpılmasını önler */
export const readableTextInputStyle: TextStyle = {
  textAlign: 'left',
  textAlignVertical: 'center',
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
};

export const textInputPaddingVertical = Platform.select({
  android: 12,
  ios: 14,
  default: 12,
}) as number;
