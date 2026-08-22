import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '../../theme';
import { useTranslation } from '@/i18n';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';

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
    alignItems: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    minHeight: 50,
    gap: Spacing[2],
    minWidth: 0,
    flexGrow: 1,
    flexShrink: 1,
  },
  icon: {
    fontSize: 16,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontSize: Typography.bodyMedium.fontSize,
    color: Colors.textPrimary,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
  },
  clear: {
    fontSize: 14,
    color: Colors.textTertiary,
    padding: 4,
    alignSelf: 'center',
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
      <Text style={styles.icon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? t('searchBar.placeholder')}
        placeholderTextColor={Colors.textTertiary}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.clear}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
