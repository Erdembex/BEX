import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { BRAND_GOLD_MID, BRAND_NAVY, BRAND_NAVY_TEXT, brandNavyAlpha } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { PasslaLogo } from '@/components/ui/PasslaLogo';

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  route: Href;
  labelKey: string;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: 'grid', route: '/(business)/panel', labelKey: 'businessSideMenu.panel' },
  { icon: 'diamond', route: '/(business)/subscription', labelKey: 'businessSideMenu.subscription' },
  { icon: 'settings-outline', route: '/settings', labelKey: 'businessSideMenu.settings' },
  { icon: 'notifications-outline', route: '/(business)/notifications', labelKey: 'businessSideMenu.notifications' },
  { icon: 'qr-code-outline', route: '/(business)/coupons' as Href, labelKey: 'businessSideMenu.coupons' },
  { icon: 'bar-chart-outline', route: '/(business)/analytics', labelKey: 'businessSideMenu.analytics' },
  { icon: 'alert-circle-outline', route: '/(business)/complaints' as Href, labelKey: 'businessSideMenu.complaints' },
  { icon: 'shield-checkmark-outline', route: '/(business)/verification', labelKey: 'businessSideMenu.verification' },
];

type BusinessMenuContextValue = {
  openMenu: () => void;
  closeMenu: () => void;
};

const BusinessMenuContext = createContext<BusinessMenuContextValue | null>(null);

export function useBusinessMenu(): BusinessMenuContextValue {
  const ctx = useContext(BusinessMenuContext);
  if (!ctx) {
    throw new Error('useBusinessMenu must be used within BusinessMenuProvider');
  }
  return ctx;
}

function BusinessSideMenu({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const Colors = useThemeColors();
  const insets = useResolvedSafeAreaInsets();
  const { t } = useTranslation();

  const navigate = (route: Href) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.close')} />
        <View
          style={[
            styles.drawer,
            {
              backgroundColor: Colors.surface,
              paddingTop: insets.top + Spacing[4],
              paddingBottom: Math.max(insets.bottom, Spacing[4]),
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <PasslaLogo size="xs" variant="wordmark" />
            <Text style={[styles.drawerSubtitle, { color: Colors.textSecondary }]}>
              {t('businessSideMenu.subtitle')}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.labelKey}
                style={[styles.menuRow, { borderBottomColor: Colors.borderLight }]}
                onPress={() => navigate(item.route)}
                activeOpacity={0.85}
              >
                <View style={[styles.menuIconWrap, { backgroundColor: brandNavyAlpha(0.35) }]}>
                  <Ionicons name={item.icon} size={20} color={BRAND_GOLD_MID} />
                </View>
                <Text style={[styles.menuLabel, { color: Colors.textPrimary }]}>
                  {t(item.labelKey)}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={BRAND_GOLD_MID} />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: BRAND_NAVY }]}
            onPress={onClose}
            activeOpacity={0.9}
          >
            <Text style={styles.closeBtnText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function BusinessMenuProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openMenu = useCallback(() => setVisible(true), []);
  const closeMenu = useCallback(() => setVisible(false), []);

  const value = useMemo(() => ({ openMenu, closeMenu }), [openMenu, closeMenu]);

  return (
    <BusinessMenuContext.Provider value={value}>
      {children}
      <BusinessSideMenu visible={visible} onClose={closeMenu} />
    </BusinessMenuContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 31, 69, 0.45)',
  },
  drawer: {
    width: '82%',
    maxWidth: 320,
    paddingHorizontal: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
  },
  drawerHeader: {
    marginBottom: Spacing[5],
    gap: Spacing[2],
  },
  drawerSubtitle: {
    ...Typography.caption,
    fontWeight: '600',
  },
  menuList: {
    paddingBottom: Spacing[4],
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    ...Typography.bodyMedium,
    flex: 1,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: Spacing[2],
    borderRadius: Radius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  closeBtnText: {
    ...Typography.labelMedium,
    color: BRAND_NAVY_TEXT,
    fontWeight: '700',
  },
});
