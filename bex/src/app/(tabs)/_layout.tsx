import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { useMessagingInboxStore } from '@/store/messagingInboxStore';
import { useTabBarStyle } from '@/components/common/Screen';
import { useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

function TabIcon({
  name,
  focused,
  locked,
  color,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  locked?: boolean;
  color: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <Ionicons name={name} size={22} color={color} style={{ opacity: locked ? 0.4 : 1 }} />
      {locked ? <Text style={styles.lockDot}>🔒</Text> : null}
    </View>
  );
}

export default function UserTabsLayout() {
  const { bexUser } = useAuthStore();
  const { isUnlocked } = useMessagingInbox('user');
  const totalUnread = useMessagingInboxStore((s) => s.userTotalUnread);
  const Colors = useThemeColors();
  const tabBarStyle = useTabBarStyle(Colors.surface, Colors.borderLight);
  const { t } = useTranslation();

  if (bexUser?.role === 'business') {
    return <Redirect href="/(business)/panel" />;
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: { ...tabBarStyle, display: 'none', height: 0 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'briefcase' : 'briefcase-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: t('tabs.trade'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="swap-horizontal"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('tabs.wallet'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites/index"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'star' : 'star-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'person-circle' : 'person-circle-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null,
          title: t('tabs.messages'),
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              focused={focused}
              locked={!isUnlocked}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="applications/index" options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="complaints/index" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  lockDot: {
    position: 'absolute',
    right: -8,
    top: -4,
    fontSize: 8,
  },
});
