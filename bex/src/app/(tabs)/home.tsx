import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { USER_TAB_BAR_HEIGHT } from '@/components/home/UserTabBar';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import {
  HomeTaskCarouselCard,
  HOME_TASK_CARD_WIDTH,
} from '@/components/home/HomeTaskCarouselCard';
import { tasksRepository, EnrichedTask } from '@/features/data';
import { useAuthStore } from '@/store/authStore';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { useNotificationUnreadCount } from '@/hooks/useNotifications';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import { formatFilterLocationLabel } from '@/lib/locationFilterUtils';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { BRAND_NAVY, BRAND_GOLD_LIGHT, brandNavyAlpha } from '@/theme/brand';
import { useTranslation } from '@/i18n';
import { LinearGradient } from 'expo-linear-gradient';

const QUICK_LINKS: { route: Href; labelKey: string; hubIcon: 'map' | 'settings' | 'profile' }[] = [
  { route: '/map' as Href, labelKey: 'userHub.map', hubIcon: 'map' },
  { route: '/settings' as Href, labelKey: 'userHub.settings', hubIcon: 'settings' },
  { route: '/(tabs)/profile' as Href, labelKey: 'userHub.profile', hubIcon: 'profile' },
];

export default function UserHomeScreen() {
  const Colors = useThemeColors();
  const tabBarPadding = useTabBarBottomPadding(16, USER_TAB_BAR_HEIGHT);
  const { t } = useTranslation();
  const { bexUser, isInitialized } = useAuthStore();
  const openNotifications = useOpenNotifications();
  const { unreadCount } = useNotificationUnreadCount();

  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  const displayName =
    bexUser?.displayName?.trim() || bexUser?.username?.trim() || t('common.user');

  useEffect(() => {
    if (!isInitialized) return;
    let cancelled = false;

    (async () => {
      const resolved = await resolveLocationFilter(bexUser);
      if (cancelled) return;
      setLocationLabel(formatFilterLocationLabel(resolved.city, resolved.district) || null);
    })();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, bexUser?.city, bexUser?.district]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const featured = await tasksRepository.getFeatured(12);
        if (!cancelled) setTasks(featured);
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const taskCountLabel = useMemo(() => {
    if (tasks.length === 0) return '';
    return String(tasks.length);
  }, [tasks.length]);

  return (
    <TabScreen style={[styles.root, { backgroundColor: Colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('userHub.profile')}
          >
            <ProfileAvatar
              name={displayName}
              avatarUrl={bexUser?.avatarUrl}
              size={44}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.locationCenter}
            onPress={() => router.push('/(tabs)/tasks')}
            activeOpacity={0.85}
          >
            <Text style={[styles.locationCaption, { color: Colors.textSecondary }]}>
              {t('userHome.currentLocation')}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={[styles.locationText, { color: Colors.textPrimary }]} numberOfLines={1}>
                {locationLabel ?? t('userHome.pickLocation')}
              </Text>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { borderColor: Colors.border, backgroundColor: Colors.surface }]}
              onPress={openNotifications}
              activeOpacity={0.85}
              accessibilityLabel={t('moreScreen.notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.iconPrimary} />
              {unreadCount > 0 ? (
                <View style={[styles.notifBadge, { backgroundColor: Colors.error }]}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={[BRAND_NAVY, brandNavyAlpha(0.92)]}
          style={styles.searchCard}
        >
          <Text style={styles.searchCardTitle}>{t('userHome.discoverTitle')}</Text>
          <Text style={styles.searchCardSubtitle}>{t('userHome.discoverSubtitle')}</Text>
          <TouchableOpacity
            style={[styles.searchBar, { backgroundColor: Colors.surface }]}
            onPress={() => router.push('/(tabs)/tasks')}
            activeOpacity={0.88}
          >
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <Text style={[styles.searchPlaceholder, { color: Colors.textMuted }]}>
              {t('userHome.searchPlaceholder')}
            </Text>
            <View style={[styles.filterBtn, { backgroundColor: BRAND_GOLD_LIGHT }]}>
              <Ionicons name="options-outline" size={18} color={BRAND_NAVY} />
            </View>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.quickRow}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.labelKey}
              style={[styles.quickChip, { backgroundColor: Colors.surface, borderColor: Colors.border }]}
              onPress={() => router.push(link.route)}
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  link.hubIcon === 'map'
                    ? 'map-outline'
                    : link.hubIcon === 'settings'
                      ? 'settings-outline'
                      : 'person-outline'
                }
                size={16}
                color={Colors.iconPrimary}
              />
              <Text style={[styles.quickChipText, { color: Colors.textPrimary }]}>
                {t(link.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>
              {t('userHome.nearbyTasks')}
            </Text>
            {taskCountLabel ? (
              <View style={[styles.countBadge, { backgroundColor: Colors.error }]}>
                <Text style={styles.countBadgeText}>{taskCountLabel}</Text>
              </View>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/tasks')}
            activeOpacity={0.85}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAll, { color: Colors.primary }]}>{t('common.seeAll')}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {locationLabel ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/tasks')}
            activeOpacity={0.85}
            style={styles.filterSummaryRow}
          >
            <Text style={[styles.filterSummary, { color: Colors.textSecondary }]} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : tasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: Colors.card, borderColor: Colors.border }]}>
            <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
              {t('userHome.emptyTasksTitle')}
            </Text>
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              {t('userHome.emptyTasksText')}
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: BRAND_NAVY }]}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <Text style={styles.emptyBtnText}>{t('userHome.browseAllTasks')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={HOME_TASK_CARD_WIDTH}
            contentContainerStyle={styles.carousel}
          >
            {tasks.map((task, index) => (
              <View key={task.id} style={index < tasks.length - 1 ? styles.carouselGap : undefined}>
                <HomeTaskCarouselCard
                  task={task}
                  onPress={() => router.push(`/task/${task.id}` as Href)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[2],
    gap: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    minHeight: 52,
  },
  locationCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  locationCaption: {
    ...Typography.caption,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '100%',
  },
  locationText: {
    ...Typography.labelMedium,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[1],
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchCard: {
    borderRadius: Radius.xl + 4,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  searchCardTitle: {
    ...Typography.labelLarge,
    fontWeight: '800',
    color: '#F0EEE9',
  },
  searchCardSubtitle: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.8)',
    marginBottom: Spacing[1],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  searchPlaceholder: {
    ...Typography.bodyMedium,
    flex: 1,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickChipText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  sectionTitle: {
    ...Typography.headingSmall,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAll: {
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -Spacing[1],
  },
  filterSummary: {
    ...Typography.caption,
    fontWeight: '600',
    flex: 1,
  },
  carousel: {
    paddingRight: Spacing[4],
    paddingVertical: Spacing[1],
  },
  carouselGap: {
    marginRight: Spacing[3],
  },
  loadingWrap: {
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: Radius.xl,
    padding: Spacing[5],
    gap: Spacing[2],
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    ...Typography.labelLarge,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
  },
  emptyBtnText: {
    ...Typography.labelMedium,
    fontWeight: '800',
    color: '#F0EEE9',
  },
});
