import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BottomTabBarProps } from "expo-router/js-tabs";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColors } from '@/theme';
import { BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { useTranslation } from '@/i18n';

/** Görünür tab bar yüksekliği (safe area hariç) */
export const BUSINESS_TAB_BAR_HEIGHT = 68;

const VISIBLE_TABS = ['applications/index', 'messages', 'tasks', 'profile'] as const;

const FAB_SIZE = 58;
const FAB_LEFT = 14;
const BAR_LEFT = 72;

function buildBarPath(width: number, height: number): string {
  const startX = BAR_LEFT - 6;

  // Üstten tam doldur — BAR_TOP boşluğu (beyaz/koyu mavi şerit) olmasın
  return `
    M 0 ${height}
    L 0 12
    Q 0 0 12 0
    L ${startX} 0
    L ${width - 12} 0
    Q ${width} 0 ${width} 12
    L ${width} ${height}
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function BusinessTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const Colors = useThemeColors();
  const insets = useResolvedSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const totalHeight = BUSINESS_TAB_BAR_HEIGHT + insets.bottom;
  const barFill = Colors.background;

  const routes = VISIBLE_TABS.map((name) => state.routes.find((r) => r.name === name)).filter(
    (route): route is (typeof state.routes)[number] => route != null
  );

  const renderTab = (route: (typeof state.routes)[number]) => {
    const { options } = descriptors[route.key];
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;
    const color = focused ? BRAND_NAVY : Colors.textTertiary;
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
      size: 24,
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
        <View style={styles.iconWrap}>
          {icon}
          {options.tabBarBadge != null ? (
            <View style={[styles.badge, { backgroundColor: Colors.error }]}>
              <Text style={styles.badgeText}>{String(options.tabBarBadge)}</Text>
            </View>
          ) : null}
        </View>
        {focused ? <View style={[styles.activeDot, { backgroundColor: BRAND_NAVY }]} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.root,
        { height: totalHeight, paddingBottom: insets.bottom, backgroundColor: barFill },
      ]}
    >
      <Svg width={width} height={totalHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path
          d={buildBarPath(width, totalHeight)}
          fill={barFill}
          stroke={Colors.borderLight}
          strokeWidth={StyleSheet.hairlineWidth}
        />
      </Svg>

      <TouchableOpacity
        style={[
          styles.fab,
          styles.fabShadow,
          {
            backgroundColor: BRAND_NAVY,
            left: FAB_LEFT,
            borderColor: barFill,
            borderWidth: 3,
          },
        ]}
        onPress={() => router.push('/(business)/create-task')}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={t('businessTabBar.createTask')}
      >
        <Ionicons name="add" size={34} color={BRAND_NAVY_TEXT} />
      </TouchableOpacity>

      <View style={[styles.tabsRow, { marginLeft: BAR_LEFT }]}>
        {routes.map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    top: -6,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fabShadow: {
    shadowColor: BRAND_NAVY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 10,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 4,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});
