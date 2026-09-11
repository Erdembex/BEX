import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useNotificationUnreadCount } from '@/hooks/useNotifications';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { PasslaLogo } from '@/components/ui/PasslaLogo';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface AppHeaderProps {
  title?: string;
  showBrand?: boolean;
  showMenu?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
  onMenuPress?: () => void;
  rightAccessory?: React.ReactNode;
}

const useStyles = createThemedStyles((Colors) => ({
  container: {
    position: 'relative',
    backgroundColor: Colors.background,
    minHeight: 52,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    gap: Spacing[3],
    minHeight: 52,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  iconPlaceholder: { width: 40 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  titleSpacer: { flex: 1 },
  brandOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 1,
  },
  menuIcon: { gap: 4, width: 18 },
  bar: {
    height: 2,
    backgroundColor: Colors.iconPrimary,
    borderRadius: 1,
  },
  backIconAndroid: {
    marginLeft: -2,
  },
  title: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
}));

export function AppHeader({
  title,
  showBrand = false,
  showMenu = true,
  showNotifications = true,
  onBack,
  onMenuPress,
  rightAccessory,
}: AppHeaderProps) {
  const styles = useStyles();
  const Colors = useThemeColors();
  const { unreadCount } = useNotificationUnreadCount();
  const openNotifications = useOpenNotifications();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={Colors.iconPrimary}
              style={Platform.OS === 'android' ? styles.backIconAndroid : undefined}
            />
          </TouchableOpacity>
        ) : showMenu ? (
          <TouchableOpacity
            onPress={onMenuPress ?? (() => router.push('/(tabs)/more' as Href))}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={t('header.openMenu')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.menuIcon}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
        {!showBrand && title ? (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.titleSpacer} />
        )}
        {onBack ? (
          rightAccessory ?? <View style={styles.iconPlaceholder} />
        ) : showNotifications ? (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={openNotifications}
            accessibilityRole="button"
            accessibilityLabel={t('header.notifications')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.iconPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      {showBrand ? (
        <View style={styles.brandOverlay} pointerEvents="none">
          <PasslaLogo size="xs" centered variant="wordmark" />
        </View>
      ) : null}
    </View>
  );
}
