import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Typography, Radius, Spacing, useThemeColors } from '@/theme';

type Props = {
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  onPress: () => void;
  badge?: string | number;
};

export function UserHubTile({ label, hint, icon, tint, onPress, badge }: Props) {
  const Colors = useThemeColors();
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: Colors.accentLight }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={[styles.label, { color: Colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.hint, { color: Colors.textSecondary }]} numberOfLines={1}>
        {hint}
      </Text>
      {badge != null && Number(badge) > 0 ? (
        <View style={[styles.badge, { backgroundColor: Colors.error }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </>
  );

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.outer}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={36} tint="light" style={styles.glass}>
          {content}
        </BlurView>
      ) : (
        <View style={[styles.glass, styles.glassAndroid, { borderColor: Colors.borderGold }]}>
          {content}
        </View>
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
    borderColor: 'rgba(255,255,255,0.35)',
  },
  glassAndroid: {
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
});
