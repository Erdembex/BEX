import React from 'react';
import { View } from 'react-native';
import { SkeletonBox } from '@/components/common/Skeleton';
import { Spacing, Radius, createThemedStyles } from '@/theme';

const useStyles = createThemedStyles((Colors) => ({
  list: {
    padding: Spacing[5],
    gap: Spacing[3],
    backgroundColor: Colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  text: { flex: 1, gap: Spacing[2] },
}));

export function MessagesInboxSkeleton() {
  const styles = useStyles();

  return (
    <View style={styles.list}>
      <SkeletonBox width="55%" height={16} />
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.row}>
          <SkeletonBox width={48} height={48} borderRadius={24} />
          <View style={styles.text}>
            <SkeletonBox width="70%" height={16} />
            <SkeletonBox width="90%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}
