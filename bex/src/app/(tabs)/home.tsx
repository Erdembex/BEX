import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreen, useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { useAuthStore } from '@/store/authStore';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { AppHeader } from '@/components/navigation/AppHeader';
import { UserHubTile } from '@/components/home/UserHubTile';
import { Typography, Spacing, useThemeColors } from '@/theme';
import { getGreeting } from '@/lib/taskUtils';
import { useTranslation } from '@/i18n';

type HubItem = {
  route: Href;
  labelKey: string;
  hintKey: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const HUB_ITEMS: HubItem[] = [
  {
    route: '/(tabs)/tasks' as Href,
    labelKey: 'userHub.tasks',
    hintKey: 'userHub.tasksHint',
    icon: 'briefcase',
  },
  {
    route: '/(tabs)/trade' as Href,
    labelKey: 'userHub.trade',
    hintKey: 'userHub.tradeHint',
    icon: 'swap-horizontal',
  },
  {
    route: '/(tabs)/wallet' as Href,
    labelKey: 'userHub.wallet',
    hintKey: 'userHub.walletHint',
    icon: 'wallet',
  },
  {
    route: '/(tabs)/messages' as Href,
    labelKey: 'userHub.messages',
    hintKey: 'userHub.messagesHint',
    icon: 'chatbubble-ellipses',
  },
  {
    route: '/(tabs)/applications' as Href,
    labelKey: 'userHub.applications',
    hintKey: 'userHub.applicationsHint',
    icon: 'document-text',
  },
  {
    route: '/(tabs)/profile' as Href,
    labelKey: 'userHub.profile',
    hintKey: 'userHub.profileHint',
    icon: 'person-circle',
  },
  {
    route: '/map' as Href,
    labelKey: 'userHub.map',
    hintKey: 'userHub.mapHint',
    icon: 'map',
  },
  {
    route: '/settings' as Href,
    labelKey: 'userHub.settings',
    hintKey: 'userHub.settingsHint',
    icon: 'settings-outline',
  },
];

export default function UserHubScreen() {
  const Colors = useThemeColors();
  const insets = useResolvedSafeAreaInsets();
  const { t } = useTranslation();
  const { bexUser } = useAuthStore();
  const { totalUnread } = useMessagingInbox('user');
  const hubIconColor = Colors.accentDark;

  const displayName =
    bexUser?.displayName?.trim() || bexUser?.username?.trim() || t('common.user');

  return (
    <TabScreen style={[styles.root, { backgroundColor: Colors.background }]}>
      <AppHeader showBrand showMenu showNotifications />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, Spacing[6]) + Spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: Colors.textPrimary }]}>
            {getGreeting(displayName, t)}
          </Text>
        </View>

        <View style={styles.grid}>
          {HUB_ITEMS.map((item) => (
            <UserHubTile
              key={item.labelKey}
              label={t(item.labelKey)}
              hint={t(item.hintKey)}
              icon={item.icon}
              tint={hubIconColor}
              badge={
                item.route === '/(tabs)/messages' && totalUnread > 0
                  ? totalUnread > 99
                    ? '99+'
                    : totalUnread
                  : undefined
              }
              onPress={() => router.push(item.route)}
            />
          ))}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[1],
    gap: Spacing[3],
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing[2],
    paddingBottom: Spacing[1],
  },
  greeting: {
    ...Typography.labelLarge,
    fontWeight: '800',
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    justifyContent: 'space-between',
  },
});
