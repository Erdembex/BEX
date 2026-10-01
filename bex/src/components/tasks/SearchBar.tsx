import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '../../theme';
import { useTranslation } from '@/i18n';
import { readableTextInputStyle } from '@/lib/textInputStyle';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  containerStyle?: import('react-native').ViewStyle;
}

const useStyles = createThemedStyles((Colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    minHeight: 52,
    gap: Spacing[2],
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  icon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: Typography.bodyMedium.fontSize,
    color: Colors.textPrimary,
    paddingVertical: 0,
    ...readableTextInputStyle,
  },
  clear: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  containerStyle,
}: SearchBarProps) {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const styles = useStyles();

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.icon}>
        <Ionicons name="search" size={18} color={Colors.iconMuted} />
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('searchBar.placeholder')}
        placeholderTextColor={Colors.textTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clear}
        >
          <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
