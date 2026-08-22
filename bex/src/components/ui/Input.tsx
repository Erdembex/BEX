import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Typography, Radius, Spacing, createThemedStyles, useThemeColors } from '../../theme';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

const useStyles = createThemedStyles((Colors) => ({
  wrapper: {
    gap: 6,
  },
  label: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
  },
  container: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
  },
  containerMultiline: {
    height: undefined,
    minHeight: 120,
    alignItems: 'flex-start',
    paddingVertical: Spacing[3],
  },
  containerFocused: {
    borderColor: Colors.borderFocus,
    backgroundColor: Colors.surface,
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  input: {
    flex: 1,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontSize: Typography.bodyLarge.fontSize,
    color: Colors.textPrimary,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 2,
    lineHeight: 22,
  },
  inputWithLeft: {
    marginLeft: 10,
  },
  leftIcon: {
    marginRight: 2,
    alignSelf: 'center',
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
    alignSelf: 'center',
  },
  passwordToggle: {
    fontSize: 16,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 2,
  },
  hint: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
}));

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  style: inputStyle,
  ...props
}: InputProps) {
  const Colors = useThemeColors();
  const styles = useStyles();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.container,
          props.multiline && styles.containerMultiline,
          isFocused && styles.containerFocused,
          hasError && styles.containerError,
          containerStyle,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            props.multiline && styles.inputMultiline,
            leftIcon ? styles.inputWithLeft : null,
            inputStyle,
          ]}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.passwordToggle}>
              {showPassword ? '🙈' : '👁'}
            </Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError && <Text style={styles.error}>{error}</Text>}
      {!hasError && hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}
