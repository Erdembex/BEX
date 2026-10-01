import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useOnboardingLayout() {
  const { height } = useWindowDimensions();
  return useMemo(
    () => ({
      IS_COMPACT_HEIGHT: height < 720,
    }),
    [height]
  );
}
