import { Platform, TextStyle } from 'react-native';
import { androidTextLayout } from '@/lib/androidUi';

/** Android release: font padding ve dikey metin kırılmasını azaltır. */
export const androidReadableText: TextStyle =
  Platform.OS === 'android' ? androidTextLayout : {};
