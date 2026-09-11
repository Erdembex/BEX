import { Tabs, Redirect, usePathname } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { useMessagingInboxStore } from '@/store/messagingInboxStore';
import { useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { UserTabBar } from '@/components/home/UserTabBar';
import { buildLoginRedirect } from '@/lib/protectedRoutes';

function TabIcon({
  name,
  focused,
  color,
  locked,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  locked?: boolean;
}) {
  const outlineName = `${name}-outline` as keyof typeof Ionicons.glyphMap;
  const iconName = focused ? name : outlineName in Ionicons.glyphMap ? outlineName : name;

  return (
    <View style={styles.iconWrap}>
      <Ionicons name={iconName} size={24} color={color} style={{ opacity: locked ? 0.4 : 1 }} />
      {locked ? <Text style={styles.lockDot}>🔒</Text> : null}
    </View>
  );
}

export default function UserTabsLayout() {
  const { bexUser, firebaseUser, isInitialized } = useAuthStore();
  const { isUnlocked } = useMessagingInbox('user');
  const totalUnread = useMessagingInboxStore((s) => s.userTotalUnread);
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const pathname = usePathname();

  if (bexUser?.role === 'business') {
    return <Redirect href="/(business)/applications/index" />;
  }

  if (isInitialized && !firebaseUser) {
    return <Redirect href={buildLoginRedirect(pathname || '/(tabs)/home')} />;
  }

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <UserTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.iconPrimary,
        tabBarInactiveTintColor: Colors.iconMuted,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="briefcase" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: t('tabs.trade'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="swap-horizontal" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabs.messages'),
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name="chatbubble-ellipses"
              focused={focused}
              color={color}
              locked={!isUnlocked}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: t('tabs.applications'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="document-text" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: t('tabs.wallet'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="wallet" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="person-circle" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="favorites/index" options={{ href: null }} />
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
