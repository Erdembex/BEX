import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from '@expo/vector-icons';
import { fetchTopEarners, fetchTopGivers, LeaderboardEntry } from '@/features/leaderboard/leaderboardApi';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type Tab = 'earners' | 'givers';

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [tab, setTab] = useState<Tab>('earners');
  const [earners, setEarners] = useState<LeaderboardEntry[]>([]);
  const [givers, setGivers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, g] = await Promise.all([fetchTopEarners(20), fetchTopGivers(20)]);
      setEarners(e);
      setGivers(g);
    } catch {
      setEarners([]);
      setGivers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const list = tab === 'earners' ? earners : givers;

  const openProfile = (item: LeaderboardEntry) => {
    if (tab === 'earners') {
      router.push(`/user/${item.profileId}` as Href);
      return;
    }
    router.push(`/business/${item.profileId}` as Href);
  };

  return (
    <Screen style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('leaderboard.title')}</Text>
      </View>

      <View style={styles.tabs}>
        {(['earners', 'givers'] as Tab[]).map((key) => {
          const active = tab === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(key)}
            >
              <Text
                style={[styles.tabText, active && styles.tabTextActive]}
                numberOfLines={1}
              >
                {key === 'earners' ? t('leaderboard.topEarners') : t('leaderboard.topGivers')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[8] }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={Colors.primary}
            />
          }
        >
          {list.length === 0 ? (
            <Text style={styles.empty}>{t('leaderboard.empty')}</Text>
          ) : (
            list.map((item) => (
              <TouchableOpacity
                key={`${tab}-${item.profileId}`}
                style={styles.row}
                activeOpacity={0.88}
                onPress={() => openProfile(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
              >
                <Text style={styles.rank}>{t('leaderboard.rank', { rank: item.rank })}</Text>
                <ProfileAvatar
                  name={item.name}
                  avatarUrl={item.avatarUrl ?? undefined}
                  size={44}
                />
                <View style={styles.rowBody}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.subtitle ? (
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <View style={styles.countWrap}>
                  <Ionicons name="gift-outline" size={16} color={Colors.iconPrimary} />
                  <Text style={styles.count}>
                    {t('leaderboard.rewardCount', { count: item.rewardCount })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.iconMuted} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function createStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    header: {
      paddingHorizontal: Spacing[5],
      paddingTop: Spacing[3],
      gap: Spacing[2],
    },
    back: { ...Typography.labelMedium, color: Colors.primary },
    title: { ...Typography.headingLarge, color: Colors.textPrimary },
    tabs: {
      flexDirection: 'row',
      marginHorizontal: Spacing[5],
      marginTop: Spacing[4],
      backgroundColor: Colors.surfaceSecondary,
      borderRadius: Radius.lg,
      padding: Spacing[1],
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[2],
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.md,
    },
    tabActive: { backgroundColor: Colors.card },
    tabText: {
      ...Typography.labelMedium,
      color: Colors.textMuted,
      textAlign: 'center',
    },
    tabTextActive: { color: Colors.primary, fontWeight: '700' },
    scroll: { padding: Spacing[5], gap: Spacing[3] },
    empty: {
      ...Typography.bodyMedium,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing[8],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      backgroundColor: Colors.card,
      borderRadius: Radius.lg,
      padding: Spacing[4],
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    rank: { ...Typography.labelLarge, color: Colors.primary, width: 36 },
    rowBody: { flex: 1, gap: 2 },
    name: { ...Typography.labelLarge, color: Colors.textPrimary },
    subtitle: { ...Typography.caption, color: Colors.textMuted },
    countWrap: { alignItems: 'flex-end', gap: 2 },
    count: { ...Typography.caption, color: Colors.textSecondary },
  });
}
