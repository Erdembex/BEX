import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import type { RewardFilterPreset } from '@/lib/rewardFilterUtils';

const PRESETS: RewardFilterPreset[] = ['gym', 'coffee', 'haircut', 'discount', 'product'];

type Props = {
  active: RewardFilterPreset | null;
  onSelect: (preset: RewardFilterPreset | null) => void;
};

export function RewardFilterChips({ active, onSelect }: Props) {
  const { t } = useTranslation();
  const Colors = useThemeColors();

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {PRESETS.map((preset) => {
        const selected = active === preset;
        return (
          <TouchableOpacity
            key={preset}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? Colors.primaryLight : Colors.surfaceSecondary,
                borderColor: selected ? Colors.primary : Colors.borderLight,
              },
            ]}
            onPress={() => onSelect(selected ? null : preset)}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected ? Colors.primary : Colors.textSecondary },
              ]}
            >
              {t(`rewardFilter.presets.${preset}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[2],
  },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: {
    ...Typography.labelMedium,
  },
});
