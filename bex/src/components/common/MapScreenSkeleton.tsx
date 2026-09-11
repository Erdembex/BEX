import React from 'react';
import { View } from 'react-native';
import { SkeletonBox } from '@/components/common/Skeleton';
import { Spacing, Radius, createThemedStyles } from '@/theme';

const useStyles = createThemedStyles((Colors) => ({
  wrap: {
    flex: 1,
    padding: Spacing[4],
    gap: Spacing[3],
    backgroundColor: Colors.background,
  },
  map: {
    flex: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
}));

export function MapScreenSkeleton() {
  const styles = useStyles();

  return (
    <View style={styles.wrap}>
      <SkeletonBox width="40%" height={20} />
      <SkeletonBox width="100%" height={44} borderRadius={Radius.md} />
      <View style={styles.map}>
        <SkeletonBox width="100%" height={280} borderRadius={Radius.lg} />
      </View>
    </View>
  );
}
