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
import { useThemeColors } from '@/theme';
import { BRAND_GOLD_MID, BRAND_NAVY, BRAND_NAVY_TEXT } from '@/theme/brand';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';

/** Görünür tab bar yüksekliği (safe area hariç) */
export const USER_TAB_BAR_HEIGHT = 68;

const LEFT_TABS = ['tasks/index', 'trade'] as const;
const RIGHT_TABS = ['messages', 'applications/index', 'wallet'] as const;

const HOME_ROUTE = 'home';
const FAB_SIZE = 58;
const TAB_ICON_SIZE = 24;

function buildBarPath(width: number, height: number, centerX: number): string {
  const notchRadius = FAB_SIZE / 2 + 10;

  const leftEnd = centerX - notchRadius;
  const rightStart = centerX + notchRadius;

  // Üstten tam doldur — BAR_TOP boşluğu (beyaz şerit) olmasın
  return `
    M 0 ${height}
    L 0 12
    Q 0 0 12 0
    L ${leftEnd} 0
    Q ${centerX - notchRadius * 0.55} 0 ${centerX - notchRadius * 0.35} 8
    Q ${centerX} 22 ${centerX + notchRadius * 0.35} 8
    Q ${centerX + notchRadius * 0.55} 0 ${rightStart} 0
    L ${width - 12} 0
    Q ${width} 0 ${width} 12
    L ${width} ${height}
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();
}

export function UserTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const Colors = useThemeColors();
  const insets = useResolvedSafeAreaInsets();
  const { width } = useWindowDimensions();
  const totalHeight = USER_TAB_BAR_HEIGHT + insets.bottom;
  const centerX = width / 2;
  const barFill = Colors.background;

  const findRoute = (name: string) => state.routes.find((r) => r.name === name);

  const renderSideTab = (routeName: string) => {
    const route = findRoute(routeName);
    if (!route) return null;

    const { options } = descriptors[route.key];
    const routeIndex = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === routeIndex;
    const color = focused ? BRAND_NAVY : Colors.textTertiary;

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
      size: TAB_ICON_SIZE,
    });

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.sideTab}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={focused ? { selected: true } : undefined}
        accessibilityLabel={typeof options.title === 'string' ? options.title : routeName}
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

  const homeRoute = findRoute(HOME_ROUTE);
  const homeIndex = homeRoute ? state.routes.findIndex((r) => r.key === homeRoute.key) : -1;
  const homeFocused = homeIndex === state.index;

  const onHomePress = () => {
    if (!homeRoute) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: homeRoute.key,
      canPreventDefault: true,
    });
    if (!homeFocused && !event.defaultPrevented) {
      navigation.navigate(homeRoute.name, homeRoute.params);
    }
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
          d={buildBarPath(width, totalHeight, centerX)}
          fill={barFill}
          stroke={Colors.borderLight}
          strokeWidth={StyleSheet.hairlineWidth}
        />
      </Svg>

      <View style={styles.tabsRow}>
        <View style={styles.sideGroup}>{LEFT_TABS.map(renderSideTab)}</View>
        <View style={styles.centerSpacer} />
        <View style={styles.sideGroup}>{RIGHT_TABS.map(renderSideTab)}</View>
      </View>

      <TouchableOpacity
        style={[
          styles.fab,
          styles.fabShadow,
          {
            backgroundColor: BRAND_NAVY,
            left: centerX - FAB_SIZE / 2,
            borderColor: homeFocused ? Colors.primary : barFill,
            borderWidth: homeFocused ? 2 : 3,
          },
        ]}
        onPress={onHomePress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityState={homeFocused ? { selected: true } : undefined}
        accessibilityLabel={
          homeRoute ? String(descriptors[homeRoute.key].options.title ?? 'Home') : 'Home'
        }
      >
        <Text style={styles.homeWordmark}>PASSLA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 10,
    zIndex: 1,
  },
  sideGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  centerSpacer: {
    width: FAB_SIZE + 16,
  },
  sideTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
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
  homeWordmark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    letterSpacing: 0.9,
    color: BRAND_GOLD_MID,
    textTransform: 'uppercase',
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
    color: BRAND_NAVY_TEXT,
    fontSize: 9,
    fontWeight: '700',
  },
});
