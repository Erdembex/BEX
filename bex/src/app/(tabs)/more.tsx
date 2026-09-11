import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { useNotificationUnreadCount } from '@/hooks/useNotifications';
import { goUserHub } from '@/lib/userHubNavigation';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type MoreLink = {
  route: Href;
  labelKey: string;
  hintKey: string;
  icon: string;
};

const MORE_LINKS: MoreLink[] = [
  {
    route: '/settings' as Href,
    labelKey: 'moreScreen.settings',
    hintKey: 'moreScreen.settingsHint',
    icon: '⚙',
  },
  {
    route: '/(tabs)/favorites' as Href,
    labelKey: 'moreScreen.favorites',
    hintKey: 'moreScreen.favoritesHint',
    icon: '★',
  },
  {
    route: '/leaderboard' as Href,
    labelKey: 'moreScreen.leaderboard',
    hintKey: 'moreScreen.leaderboardHint',
    icon: '🏆',
  },
  {
    route: '/map' as Href,
    labelKey: 'moreScreen.map',
    hintKey: 'moreScreen.mapHint',
    icon: '🗺',
  },
  {
    route: '/about' as Href,
    labelKey: 'moreScreen.about',
    hintKey: 'moreScreen.aboutHint',
    icon: 'ℹ',
  },
  {
    route: '/(tabs)/complaints' as Href,
    labelKey: 'moreScreen.complaint',
    hintKey: 'moreScreen.complaintHint',
    icon: '⚠',
  },
];

export default function MoreScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();
  const openNotifications = useOpenNotifications();
  const { unreadCount } = useNotificationUnreadCount();

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('moreScreen.title')} showMenu={false} showNotifications={false} onBack={goUserHub} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}>
        <TouchableOpacity style={styles.noticeCard} activeOpacity={0.88} onPress={openNotifications}>
          <View style={styles.noticeLeft}>
            <Text style={styles.noticeIcon}>◉</Text>
            <View>
              <Text style={styles.noticeTitle}>{t('moreScreen.notifications')}</Text>
              <Text style={styles.noticeHint}>{t('moreScreen.notificationsHint')}</Text>
            </View>
          </View>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.section}>{t('moreScreen.other')}</Text>
        {MORE_LINKS.map((link) => (
          <TouchableOpacity
            key={link.labelKey}
            style={styles.linkRow}
            activeOpacity={0.88}
            onPress={() => router.push(link.route)}
          >
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <View style={styles.linkBody}>
              <Text style={styles.linkTitle}>{t(link.labelKey)}</Text>
              <Text style={styles.linkHint}>{t(link.hintKey)}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[3] },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  noticeIcon: { fontSize: 22, color: Colors.iconPrimary, fontWeight: '700' },
  noticeTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  noticeHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '800', fontSize: 11 },
  section: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing[2],
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkIcon: { width: 28, textAlign: 'center', fontSize: 18, color: Colors.iconPrimary },
  linkBody: { flex: 1, gap: 2 },
  linkTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  linkHint: { ...Typography.caption, color: Colors.textSecondary },
  chevron: { ...Typography.headingMedium, color: Colors.textMuted, fontWeight: '300' },
}));
