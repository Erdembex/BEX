import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type DrawerNavigation = {
  navigate: (route: string) => void;
  closeDrawer: () => void;
};

type DrawerState = {
  routes: { name: string; key: string }[];
  index: number;
};

interface AppDrawerContentProps {
  state: DrawerState;
  navigation: DrawerNavigation;
  unreadCount?: number;
}

type MenuItem = {
  route: string;
  labelKey: string;
  icon: string;
  href?: Href;
};

type MenuSection = {
  titleKey: string;
  items: MenuItem[];
};

const MENU_SECTIONS: MenuSection[] = [
  {
    titleKey: 'appDrawer.sectionDiscover',
    items: [
      { route: 'home', labelKey: 'appDrawer.home', icon: '⌂' },
      { route: 'tasks/index', labelKey: 'appDrawer.tasks', icon: '◎' },
      { route: 'complaints/index', labelKey: 'appDrawer.complaints', icon: '⚠' },
    ],
  },
  {
    titleKey: 'appDrawer.sectionActivity',
    items: [
      { route: 'applications/index', labelKey: 'appDrawer.applications', icon: '☰' },
      { route: 'trade', labelKey: 'appDrawer.trade', icon: '⇄' },
      { route: 'wallet', labelKey: 'appDrawer.wallet', icon: '▣' },
    ],
  },
  {
    titleKey: 'appDrawer.sectionAccount',
    items: [
      { route: 'notifications/index', labelKey: 'appDrawer.notifications', icon: '◉' },
      { route: 'profile', labelKey: 'appDrawer.profile', icon: '○' },
      { route: 'settings', labelKey: 'appDrawer.settings', icon: '⚙', href: '/settings' as Href },
    ],
  },
];

export function AppDrawerContent({ state, navigation, unreadCount = 0 }: AppDrawerContentProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const insets = useSafeAreaInsets();
  const { bexUser } = useAuthStore();
  const { t } = useTranslation();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing[2] }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileBlock}
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('profile');
            navigation.closeDrawer();
          }}
        >
          <ProfileAvatar
            name={bexUser?.displayName}
            avatarUrl={bexUser?.avatarUrl}
            size={52}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {bexUser?.displayName ?? t('appDrawer.defaultUser')}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {bexUser?.email ?? '—'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {MENU_SECTIONS.map((section) => (
          <View key={section.titleKey} style={styles.section}>
            <Text style={styles.sectionTitle}>{t(section.titleKey)}</Text>
            {section.items.map((item) => {
              const active = activeRoute === item.route;
              const badge = item.route === 'notifications/index' && unreadCount > 0;

              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.menuItem, active && styles.menuItemActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (item.href) {
                      router.push(item.href);
                    } else {
                      navigation.navigate(item.route);
                    }
                    navigation.closeDrawer();
                  }}
                >
                  <Text style={[styles.menuIcon, active && styles.menuIconActive]}>
                    {item.icon}
                  </Text>
                  <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                    {t(item.labelKey)}
                  </Text>
                  {badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <Text style={styles.footerText}>{t('appDrawer.footer')}</Text>
      </View>
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    marginBottom: Spacing[3],
  },
  profileText: { flex: 1, gap: 2 },
  profileName: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  profileEmail: { ...Typography.caption, color: Colors.textSecondary },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing[3],
  },
  section: {
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing[1],
    paddingHorizontal: Spacing[3],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: 2,
  },
  menuItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textMuted,
  },
  menuIconActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  menuLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  menuLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
}));
