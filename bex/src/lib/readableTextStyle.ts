import { Platform, TextStyle } from 'react-native';

/** Android release: font padding ve dikey metin kırılmasını azaltır. */
export const androidReadableText: TextStyle =
  Platform.OS === 'android'
    ? { includeFontPadding: false, textBreakStrategy: 'simple' as const }
    : {};
