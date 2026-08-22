import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { useMessagingInboxStore } from '@/store/messagingInboxStore';
import { useThemeColors } from '@/theme';
import { useTabBarStyle } from '@/components/common/Screen';
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

export default function BusinessTabsLayout() {
  const { bexUser } = useAuthStore();
  const { business } = useBusiness();
  const { isUnlocked } = useMessagingInbox('business');
  const totalUnread = useMessagingInboxStore((s) => s.businessTotalUnread);
  const Colors = useThemeColors();
  const tabBarStyle = useTabBarStyle(Colors.surface, Colors.borderLight);
  const { t } = useTranslation();

  if (bexUser && bexUser.role !== 'business') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      initialRouteName="panel"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.secondary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="panel"
        options={{
          title: t('tabsBusiness.panel'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: t('tabsBusiness.applications'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'file-tray-full' : 'file-tray-full-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t('tabsBusiness.messages'),
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              focused={focused}
              locked={!isUnlocked && !!business?.id}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabsBusiness.tasks'),
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
        name="coupons/index"
        options={{
          title: t('tabsBusiness.coupons'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'pricetag' : 'pricetag-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabsBusiness.profile'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              name={focused ? 'person-circle' : 'person-circle-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="profile-search" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="create-task" options={{ href: null }} />
      <Tabs.Screen name="applications/[id]" options={{ href: null }} />
      <Tabs.Screen name="edit-task/[id]" options={{ href: null }} />
      <Tabs.Screen name="complaints/index" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
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
