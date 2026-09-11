import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography, Radius, Spacing, useThemeColors, useIsDarkMode, useThemeShadow } from '@/theme';
import { BRAND_GOLD_LIGHT } from '@/theme/brand';
import { HubIconKey, HUB_ICONS } from '@/components/home/hubIcons';

type Props = {
  label: string;
  hint: string;
  hubIcon: HubIconKey;
  onPress: () => void;
  badge?: string | number;
};

export function UserHubTile({ label, hint, hubIcon, onPress, badge }: Props) {
  const Colors = useThemeColors();
  const Shadow = useThemeShadow();
  const isDark = useIsDarkMode();

  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          isDark
            ? { backgroundColor: Colors.iconSurface }
            : {
                backgroundColor: BRAND_GOLD_LIGHT,
                borderWidth: 1.5,
                borderColor: Colors.borderGold,
                ...Shadow.sm,
              },
        ]}
      >
        <Image source={HUB_ICONS[hubIcon]} style={styles.iconImage} resizeMode="contain" />
      </View>
      <Text style={[styles.label, { color: Colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.hint, { color: Colors.textSecondary }]} numberOfLines={1}>
        {hint}
      </Text>
      {badge != null && Number(badge) > 0 ? (
        <View style={[styles.badge, { backgroundColor: Colors.error }]}>
          <Text style={[styles.badgeText, { color: Colors.textOnPrimary }]}>{badge}</Text>
        </View>
      ) : null}
    </>
  );

  const glassBorder = isDark ? Colors.border : Colors.border;
  const glassFill = isDark ? Colors.card : Colors.surface;

  const cardStyle = [
    styles.glass,
    { borderColor: glassBorder },
    !isDark && { backgroundColor: glassFill, ...Shadow.card },
  ];

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.outer}>
      {Platform.OS === 'ios' && isDark ? (
        <BlurView intensity={52} tint="dark" style={cardStyle}>
          {content}
        </BlurView>
      ) : (
        <View style={[...cardStyle, styles.glassSolid]}>{content}</View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: '48%',
  },
  glass: {
    borderRadius: Radius.lg,
    padding: Spacing[3],
    minHeight: 102,
    gap: Spacing[1],
    overflow: 'hidden',
    borderWidth: 1,
  },
  glassSolid: {
    opacity: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 28,
    height: 28,
  },
  label: {
    ...Typography.labelMedium,
    fontWeight: '800',
  },
  hint: {
    ...Typography.caption,
    lineHeight: 14,
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '800',
    fontSize: 11,
  },
});
