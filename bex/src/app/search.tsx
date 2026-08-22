import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { businessesRepository, tasksRepository, EnrichedTask } from '@/features/data';
import { searchBusinessProfiles, BusinessSearchHit } from '@/features/business/businessProfileApi';
import { SearchBar } from '@/components/tasks/SearchBar';
import { TaskCard } from '@/components/tasks';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function SearchScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { q: initialQ } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(typeof initialQ === 'string' ? initialQ : '');
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [businesses, setBusinesses] = useState<BusinessSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setTasks([]);
      setBusinesses([]);
      return;
    }

    setLoading(true);
    try {
      const [taskHits, businessHits] = await Promise.all([
        tasksRepository.search(trimmed, null, null),
        searchBusinessProfiles(trimmed),
      ]);
      setTasks(taskHits.slice(0, 15));
      setBusinesses(businessHits.slice(0, 10));
    } catch {
      setTasks([]);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    if (typeof initialQ === 'string' && initialQ.trim()) {
      void runSearch(initialQ);
    }
  }, [initialQ, runSearch]);

  return (
    <Screen style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t('searchScreen.placeholder')}
            onSubmit={() => void runSearch(query)}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {query.trim().length < 2 ? (
            <Text style={styles.hint}>{t('searchScreen.minChars')}</Text>
          ) : null}

          {businesses.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('searchScreen.businesses')}</Text>
              {businesses.map((biz) => (
                <TouchableOpacity
                  key={biz.profileId}
                  style={styles.bizRow}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/business/${biz.profileId}` as Href)}
                >
                  <View style={styles.bizAvatar}>
                    <Text style={styles.bizAvatarText}>{biz.businessName.slice(0, 1)}</Text>
                  </View>
                  <View style={styles.bizMeta}>
                    <Text style={styles.bizName}>
                      {biz.businessName}
                      {biz.verified ? ' ✓' : ''}
                    </Text>
                    <Text style={styles.bizSub}>
                      {biz.locationLabel || t('searchScreen.noLocation')}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {tasks.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('searchScreen.tasks')}</Text>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  businessName={task.businessName}
                  businessVerified={task.businessVerified}
                  businessIsDangerous={task.businessIsDangerous}
                  compact
                  onPress={() => router.push(`/task/${task.id}` as Href)}
                />
              ))}
            </View>
          ) : null}

          {query.trim().length >= 2 && !loading && tasks.length === 0 && businesses.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>{t('searchScreen.noResults')}</Text>
              <Text style={styles.emptyText}>{t('searchScreen.noResultsHint')}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  searchWrap: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  hint: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  section: { gap: Spacing[3] },
  sectionTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bizAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizAvatarText: { ...Typography.labelLarge, color: Colors.primary, fontWeight: '800' },
  bizMeta: { flex: 1, gap: 2 },
  bizName: { ...Typography.labelMedium, color: Colors.textPrimary, fontWeight: '700' },
  bizSub: { ...Typography.caption, color: Colors.textSecondary },
  chevron: { ...Typography.headingMedium, color: Colors.textMuted, fontWeight: '300' },
  empty: { alignItems: 'center', paddingTop: Spacing[8], gap: Spacing[2] },
  emptyTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
}));
