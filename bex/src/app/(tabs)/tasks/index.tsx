import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { TabScreen, useTabBarBottomPadding } from '@/components/common/Screen';
import { USER_TAB_BAR_HEIGHT } from '@/components/home/UserTabBar';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "expo-router/react-navigation";
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { tasksRepository, EnrichedTask } from '@/features/data';
import { shouldUseListingsRest } from '@/features/listing/listingsApi';
import { TaskCategory, TaskDifficulty } from '@/types';
import { SearchBar, CategoryFilter, ListingProjectCard, RewardFilterChips } from '@/components/tasks';
import { LocationFilter } from '@/components/common/LocationPicker';
import { TaskListSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useAuthStore } from '@/store/authStore';
import { loadLocationFilter, saveLocationFilter } from '@/lib/locationFilterStorage';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import { resolveRewardFilter, type RewardFilterPreset } from '@/lib/rewardFilterUtils';
import { matchesEnrichedTaskSearch, resolveTaskSearchParams } from '@/lib/taskSearchUtils';
import { useCategoryLabels } from '@/constants/taskLabels';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';
import { useDifficultyLabels } from '@/constants/taskLabels';

const DIFFICULTIES: (TaskDifficulty | null)[] = [null, 'easy', 'medium', 'hard'];

export default function TasksScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const tabBarPadding = useTabBarBottomPadding(24, USER_TAB_BAR_HEIGHT);
  const { t } = useTranslation();
  const difficultyLabels = useDifficultyLabels();
  const categoryLabels = useCategoryLabels();
  const DIFF_LABELS: Record<string, string> = {
    all: t('tasksScreen.difficultyAll'),
    ...difficultyLabels,
  };
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { bexUser, isInitialized } = useAuthStore();
  const didInitFilter = useRef(false);
  const didInitSearch = useRef(false);
  const [search, setSearch] = useState('');
  const [rewardPreset, setRewardPreset] = useState<RewardFilterPreset | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [filterReady, setFilterReady] = useState(false);
  const [category, setCategory] = useState<TaskCategory | null>(null);
  const [difficulty, setDifficulty] = useState<TaskDifficulty | null>(null);
  const [restListings, setRestListings] = useState(false);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    shouldUseListingsRest().then(setRestListings);
  }, []);

  useEffect(() => {
    if (didInitSearch.current) return;
    const query = typeof q === 'string' ? q.trim() : '';
    if (query) {
      setSearch(query);
      didInitSearch.current = true;
    }
  }, [q]);

  useEffect(() => {
    if (!isInitialized || didInitFilter.current) return;

    let cancelled = false;

    (async () => {
      const resolved = await resolveLocationFilter(bexUser);
      if (cancelled) return;

      setCity(resolved.city);
      setDistrict(resolved.district);

      didInitFilter.current = true;
      setFilterReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isInitialized, bexUser?.city, bexUser?.district]);

  useEffect(() => {
    if (!filterReady) return;
    saveLocationFilter({ city, district });
  }, [city, district, filterReady]);

  useFocusEffect(
    useCallback(() => {
      if (!filterReady) return;
      let cancelled = false;
      loadLocationFilter().then((saved) => {
        if (cancelled || !saved) return;
        setCity(saved.city);
        setDistrict(saved.district);
      });
      return () => {
        cancelled = true;
      };
    }, [filterReady])
  );

  const taskSearchParams = useMemo(
    () => (rewardPreset ? {} : resolveTaskSearchParams(search)),
    [search, rewardPreset]
  );

  const filterTasks = useCallback(
    (list: EnrichedTask[]) =>
      list.filter((task) => {
        if (category && task.category !== category) return false;
        if (difficulty && task.difficulty !== difficulty) return false;
        if (search.trim() && !matchesEnrichedTaskSearch(task, search, categoryLabels)) {
          return false;
        }
        return true;
      }),
    [category, difficulty, search, categoryLabels]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const rewardFilter = rewardPreset
        ? resolveRewardFilter(rewardPreset, '')
        : taskSearchParams.q
          ? { q: taskSearchParams.q }
          : {};
      const { tasks: fetched, lastDoc: doc, nextCursor: cursor } = await tasksRepository.getActive(
        10,
        null,
        {
          city: city ?? undefined,
          district: district ?? undefined,
          category,
          skills: taskSearchParams.skills,
          q: rewardFilter.q,
          rewardType: rewardFilter.rewardType,
        }
      );
      setTasks(fetched);
      setLastDoc(doc);
      setNextCursor(cursor);
      setHasMore(cursor !== null || (doc !== null && fetched.length >= 10));
    } catch {
      setTasks([]);
      setLoadError(t('tasksScreen.loadError'));
    } finally {
      setLoading(false);
    }
  }, [city, district, category, taskSearchParams, rewardPreset, t]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    if (!nextCursor && !lastDoc) return;
    setLoadingMore(true);
    const cursorArg = nextCursor ?? lastDoc ?? undefined;
    const rewardFilter = rewardPreset
      ? resolveRewardFilter(rewardPreset, '')
      : taskSearchParams.q
        ? { q: taskSearchParams.q }
        : {};
    const { tasks: fetched, lastDoc: doc, nextCursor: cursor } = await tasksRepository.getActive(
      10,
      cursorArg,
      {
        city: city ?? undefined,
        district: district ?? undefined,
        category,
        skills: taskSearchParams.skills,
        q: rewardFilter.q,
        rewardType: rewardFilter.rewardType,
      }
    );
    setTasks((prev) => [...prev, ...fetched]);
    setLastDoc(doc);
    setNextCursor(cursor);
    setHasMore(cursor !== null || (doc !== null && fetched.length >= 10));
    setLoadingMore(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!filterReady) return;
    loadInitial();
  }, [loadInitial, filterReady]);

  const displayed = filterTasks(tasks);
  const listLoading = loading;
  const listEmptyMessage = t('tasksScreen.noResults');

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t('tasksScreen.subtitle')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push('/leaderboard' as Href)}
              style={styles.toolBtn}
            >
              <Ionicons name="trophy-outline" size={18} color={Colors.iconPrimary} />
              <Text style={styles.toolBtnText}>{t('leaderboard.title')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filters}>
          <SearchBar
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              if (v.trim()) setRewardPreset(null);
            }}
            placeholder={t('tasksScreen.searchPlaceholder')}
          />
          {restListings ? (
            <RewardFilterChips
              active={rewardPreset}
              onSelect={(preset) => {
                setRewardPreset(preset);
                if (preset) setSearch('');
              }}
            />
          ) : null}
          <LocationFilter
            city={city}
            district={district}
            onCityChange={setCity}
            onDistrictChange={setDistrict}
            showMapPicker
            mapPickerReturnTo="/(tabs)/tasks"
          />
          <CategoryFilter selected={category} onSelect={setCategory} />
          {!restListings ? (
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => {
                const key = d ?? 'all';
                const active = difficulty === d;
                return (
                  <Text
                    key={key}
                    style={[styles.diffChip, active && styles.diffChipActive]}
                    onPress={() => setDifficulty(d)}
                  >
                    {DIFF_LABELS[key]}
                  </Text>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>
    ),
    [
      Colors.primary,
      DIFF_LABELS,
      category,
      city,
      difficulty,
      district,
      restListings,
      rewardPreset,
      search,
      styles,
      t,
    ]
  );

  return (
    <TabScreen style={styles.safe}>
      <AppHeader title={t('tasksScreen.title')} showMenu showNotifications />
      <FlatList
        style={styles.listContainer}
        data={displayed}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          listLoading ? (
            <TaskListSkeleton count={5} />
          ) : loadError ? (
            <Text style={[styles.emptyState, styles.emptyError]}>{loadError}</Text>
          ) : (
            <Text style={styles.emptyState}>{listEmptyMessage}</Text>
          )
        }
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
  listContainer: { flex: 1 },
  listHeader: { gap: 0 },
  header: { paddingHorizontal: Spacing[5], paddingTop: Spacing[1], paddingBottom: Spacing[2], gap: Spacing[3] },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary },
  headerActions: { flexDirection: 'row', gap: Spacing[2] },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolBtnText: { ...Typography.caption, color: Colors.iconPrimary, fontWeight: '600' },
  toolBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  toolBtnTextActive: {
    color: Colors.textOnPrimary,
  },
  filters: { paddingHorizontal: Spacing[5], gap: Spacing[3], paddingBottom: Spacing[3] },
  diffRow: { flexDirection: 'row', gap: Spacing[2] },
  diffChip: {
    ...Typography.caption,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
    overflow: 'hidden',
  },
  diffChipActive: {
    backgroundColor: Colors.primary,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  list: { flexGrow: 1 },
  gridRow: { gap: Spacing[3], paddingHorizontal: Spacing[5], marginBottom: Spacing[3] },
  emptyState: {
    ...Typography.bodyMedium,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
  emptyError: { color: Colors.error },
}));
