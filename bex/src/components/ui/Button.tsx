import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/theme/restyle';
import { Radius, Spacing, Typography, useThemeColors, useThemeShadow } from '@/theme';
import { BRAND_GOLD, BRAND_GOLD_AMBER, BRAND_GOLD_VIVID, BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

const SIZE_HEIGHT: Record<Size, number> = {
  sm: 40,
  md: 48,
  lg: 56,
};

const NAVY_VARIANTS = new Set<Variant>(['primary', 'secondary', 'outline']);

type TextVariant = Exclude<keyof Theme['textVariants'], 'defaults'>;

const TEXT_VARIANT: Record<Variant, TextVariant> = {
  primary: 'buttonPrimary',
  secondary: 'buttonPrimary',
  outline: 'buttonPrimary',
  ghost: 'buttonOutline',
  danger: 'buttonDanger',
  gold: 'buttonPrimary',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const Colors = useThemeColors();
  const Shadow = useThemeShadow();
  const isDisabled = disabled || loading;
  const isNavy = NAVY_VARIANTS.has(variant);
  const isGold = variant === 'gold';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        box: {
          borderRadius: Radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: Spacing[5],
          height: SIZE_HEIGHT[size],
          opacity: isDisabled ? 0.45 : 1,
          width: fullWidth ? '100%' : undefined,
          backgroundColor: isGold
            ? 'transparent'
            : isNavy
              ? BRAND_NAVY
              : variant === 'danger'
                ? Colors.error
                : 'transparent',
          borderWidth: isNavy ? 1 : variant === 'ghost' ? 0 : variant === 'danger' ? 0 : 0,
          borderColor: isNavy ? Colors.borderGold : 'transparent',
          overflow: 'hidden',
        },
        label: {
          ...(isNavy || variant === 'danger' || isGold
            ? Typography.labelLarge
            : Typography.labelLarge),
          fontWeight: '700',
          color: isGold
            ? '#031528'
            : isNavy || variant === 'danger'
              ? variant === 'danger'
                ? Colors.textOnPrimary
                : BRAND_NAVY_TEXT
              : Colors.primary,
        },
      }),
    [Colors, isDisabled, isGold, isNavy, size, variant, fullWidth]
  );

  const loaderColor = isGold
    ? '#031528'
    : isNavy || variant === 'danger'
      ? BRAND_NAVY_TEXT
      : Colors.primary;

  const content = loading ? (
    <ActivityIndicator color={loaderColor} size="small" />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {leftIcon}
      <Text variant={TEXT_VARIANT[variant]} style={[styles.label, textStyle]}>
        {title}
      </Text>
    </View>
  );

  if (isGold) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.82}
        style={[fullWidth && { width: '100%' }, !isDisabled && Shadow.primary, style]}
      >
        <LinearGradient
          colors={[BRAND_GOLD_VIVID, BRAND_GOLD, BRAND_GOLD_AMBER]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.box}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        fullWidth && { width: '100%' },
        isNavy && !isDisabled && Shadow.primary,
        style,
      ]}
    >
      <View style={styles.box}>
        {content}
      </View>
    </TouchableOpacity>
  );
}
