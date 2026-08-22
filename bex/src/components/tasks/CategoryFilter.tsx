import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { TaskCategory } from '../../types';
import { ALL_CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS } from '../../constants/taskLabels';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '../../theme';
import { useTranslation } from '@/i18n';

interface CategoryFilterProps {
  selected: TaskCategory | null;
  onSelect: (category: TaskCategory | null) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <TouchableOpacity
        style={[styles.chip, !selected && styles.chipActive]}
        onPress={() => onSelect(null)}
        activeOpacity={0.75}
      >
        <Text style={[styles.chipText, !selected && styles.chipTextActive]}>
          {t('categoryFilter.all')}
        </Text>
      </TouchableOpacity>

      {ALL_CATEGORIES.map((cat) => {
        const active = selected === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? null : cat)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{CATEGORY_ICONS[cat]}</Text>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  row: {
    gap: Spacing[2],
    paddingVertical: Spacing[1],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
}));
