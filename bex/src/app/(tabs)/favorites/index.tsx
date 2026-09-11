import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { router } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import { Ionicons } from '@expo/vector-icons';
import { tasksRepository, EnrichedTask } from '@/features/data';
import { useSavedListingsStore } from '@/store/savedListingsStore';
import { useAuthStore } from '@/store/authStore';
import { ListingProjectCard } from '@/components/tasks';
import { AppHeader } from '@/components/navigation/AppHeader';
import { userHubBackHeaderProps } from '@/lib/userHubNavigation';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function FavoritesScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding();
  const { t } = useTranslation();
  const { firebaseUser } = useAuthStore();
  const savedIds = useSavedListingsStore((s) => s.ids);
  const savedReady = useSavedListingsStore((s) => s.ready);
  const refreshSaved = useSavedListingsStore((s) => s.refresh);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!savedReady) return;
    if (!savedIds.length) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(savedIds.map((id) => tasksRepository.getEnrichedById(id)));
      setTasks(results.filter((task): task is EnrichedTask => task != null));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [savedIds, savedReady]);

  useFocusEffect(
    useCallback(() => {
      refreshSaved().finally(() => loadFavorites());
    }, [refreshSaved, loadFavorites])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSaved();
    await loadFavorites();
    setRefreshing(false);
  };

  const emptyContent = !firebaseUser ? (
    <View style={styles.emptyWrap}>
      <Ionicons name="star-outline" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>{t('favoritesScreen.loginTitle')}</Text>
      <Text style={styles.emptyText}>{t('favoritesScreen.loginText')}</Text>
      <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(auth)/login')}>
        <Text style={styles.ctaBtnText}>{t('auth.login')}</Text>
      </TouchableOpacity>
    </View>
  ) : loading ? (
    <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[10] }} />
  ) : (
    <View style={styles.emptyWrap}>
      <Ionicons name="star-outline" size={48} color={Colors.textTertiary} />
      <Text style={styles.emptyTitle}>{t('favoritesScreen.emptyTitle')}</Text>
      <Text style={styles.emptyText}>{t('favoritesScreen.emptyText')}</Text>
      <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/tasks')}>
        <Text style={styles.ctaBtnText}>{t('favoritesScreen.browseTasks')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('tabs.favorites')} {...userHubBackHeaderProps()} />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarPadding },
          tasks.length === 0 && styles.listEmpty,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListHeaderComponent={
          tasks.length > 0 ? (
            <Text style={styles.subtitle}>{t('favoritesScreen.subtitle', { count: tasks.length })}</Text>
          ) : null
        }
        ListEmptyComponent={emptyContent}
        renderItem={({ item, index }) => (
          <ListingProjectCard
            task={item}
            variant="user"
            highlighted={index === 0}
            onPress={() => router.push(`/task/${item.id}`)}
          />
        )}
      />
    </TabScreen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { flexGrow: 1, paddingTop: Spacing[2] },
  listEmpty: { flexGrow: 1 },
  gridRow: { gap: Spacing[3], paddingHorizontal: Spacing[5], marginBottom: Spacing[3] },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[3],
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingTop: Spacing[12],
    gap: Spacing[3],
  },
  emptyTitle: {
    ...Typography.headingSmall,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaBtn: {
    marginTop: Spacing[3],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  ctaBtnText: {
    ...Typography.labelLarge,
    color: Colors.textOnGold,
    fontWeight: '700',
  },
}));
