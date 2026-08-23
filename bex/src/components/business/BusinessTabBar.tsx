import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColors } from '@/theme';
import { BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';

const VISIBLE_TABS = [
  'panel',
  'applications/index',
  'messages',
  'tasks',
  'subscription',
  'profile',
] as const;

const FAB_AFTER_INDEX = 3;

export function BusinessTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const Colors = useThemeColors();
  const insets = useResolvedSafeAreaInsets();

  const routes = VISIBLE_TABS.map((name) => state.routes.find((r) => r.name === name)).filter(
    (route): route is (typeof state.routes)[number] => route != null
  );

  const leftRoutes = routes.slice(0, FAB_AFTER_INDEX);
  const rightRoutes = routes.slice(FAB_AFTER_INDEX);

  const renderTab = (route: (typeof state.routes)[number]) => {
    const { options } = descriptors[route.key];
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;
    const color = focused ? Colors.secondary : Colors.textTertiary;
    const label = options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const icon = options.tabBarIcon?.({
      focused,
      color,
      size: 22,
    });

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tab}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : undefined}
        accessibilityLabel={typeof label === 'string' ? label : route.name}
      >
        {icon}
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {options.tabBarBadge != null ? (
          <View style={[styles.badge, { backgroundColor: Colors.error }]}>
            <Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0),
        },
      ]}
    >
      <View style={styles.row}>
        {leftRoutes.map(renderTab)}
        <View style={styles.fabSlot} />
        {rightRoutes.map(renderTab)}
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: BRAND_NAVY }, styles.fabShadow]}
        onPress={() => router.push('/(business)/create-task')}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Yeni ilan oluştur"
      >
        <Ionicons name="add" size={30} color={BRAND_NAVY_TEXT} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    position: 'relative',
    minHeight: 62,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 48,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  fabSlot: {
    width: 72,
  },
  fab: {
    position: 'absolute',
    top: -22,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabShadow: {
    shadowColor: '#051F45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
