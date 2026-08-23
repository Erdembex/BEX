import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  variant?: 'default' | 'glass';
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
  labelGlass: {
    ...Typography.labelMedium,
    color: 'rgba(240, 238, 233, 0.88)',
  },
  containerGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  containerGlassFocused: {
    borderColor: 'rgba(231, 198, 99, 0.65)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputGlass: {
    color: '#F0EEE9',
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
  variant = 'default',
  style: inputStyle,
  ...props
}: InputProps) {
  const Colors = useThemeColors();
  const styles = useStyles();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;
  const isGlass = variant === 'glass';
  const placeholderColor = isGlass ? 'rgba(240, 238, 233, 0.45)' : Colors.textMuted;
  const selectionColor = isGlass ? '#E7C663' : Colors.primary;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={isGlass ? styles.labelGlass : styles.label}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.container,
          props.multiline && styles.containerMultiline,
          isGlass && styles.containerGlass,
          isFocused && (isGlass ? styles.containerGlassFocused : styles.containerFocused),
          hasError && styles.containerError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            isGlass && styles.inputGlass,
            props.multiline && styles.inputMultiline,
            leftIcon ? styles.inputWithLeft : null,
            inputStyle,
          ]}
          placeholderTextColor={placeholderColor}
          selectionColor={selectionColor}
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
            {isGlass ? (
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="rgba(240, 238, 233, 0.72)"
              />
            ) : (
              <Text style={styles.passwordToggle}>{showPassword ? '🙈' : '👁'}</Text>
            )}
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
