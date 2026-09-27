import { useMemo } from 'react';
import { Platform, useWindowDimensions, ViewStyle } from 'react-native';
import { androidTextLayout } from '@/lib/androidUi';

/** Telefonlarda içeriği ortada tutar (AAB'de modül genişliği kullanılmaz). */
export function usePageColumnStyle(): ViewStyle {
  const { width } = useWindowDimensions();
  return useMemo(
    () => ({
      width: '100%',
      maxWidth: Math.min(width, 440),
      alignSelf: 'center',
    }),
    [width]
  );
}

export const pageReadableText =
  Platform.OS === 'android' ? androidTextLayout : ({} as const);
