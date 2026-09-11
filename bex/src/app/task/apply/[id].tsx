import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { tasksRepository, applicationsRepository, EnrichedTask } from '@/features/data';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { isBackendId } from '@/lib/api/backendId';
import { usersRepository } from '@/features/data/usersRepository';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/common/Toast';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { PortfolioItem } from '@/types';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { isTaskOpenForApplications } from '@/lib/taskUtils';
import { useTranslation } from '@/i18n';

export default function ApplyScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser, bexUser } = useAuthStore();
  const { showToast } = useToast();
  const [task, setTask] = useState<EnrichedTask | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) tasksRepository.getEnrichedById(id).then(setTask);
  }, [id]);

  useEffect(() => {
    if (!firebaseUser) return;
    usersRepository.getPortfolio(firebaseUser.uid).then(setPortfolio);
  }, [firebaseUser]);

  const handleSubmit = async () => {
    const trimmed = coverLetter.trim();
    const minLength =
      (await hasRestAuthSession()) && task && isBackendId(task.id) ? 50 : 20;

    if (!trimmed || trimmed.length < minLength) {
      setError(
        minLength >= 50
          ? t('applyScreen.errorMin50')
          : t('applyScreen.errorMin20')
      );
      return;
    }
    if (!firebaseUser || !task) return;

    if (!isTaskOpenForApplications(task)) {
      setError(t('applyScreen.errorExpired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await applicationsRepository.create(firebaseUser.uid, {
        taskId: task.id,
        businessId: task.businessId,
        coverLetter: trimmed,
        portfolioUrl: portfolioUrl.trim() || undefined,
      });
      showToast(t('applyScreen.successToast'));
      router.replace('/(tabs)/applications' as Href);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      setError(
        code === 'already-applied'
          ? t('applyScreen.errorAlreadyApplied')
          : err instanceof Error
            ? err.message
            : t('applyScreen.errorGeneric')
      );
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseUser) {
    return (
      <Redirect
        href={{
          pathname: '/(auth)/login',
          params: { returnTo: `/task/apply/${id ?? ''}` },
        }}
      />
    );
  }

  return (
    <Screen style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('applyScreen.back')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{t('applyScreen.title')}</Text>
          {task && (
            <View style={styles.taskPreview}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <Text style={styles.taskReward}>🎁 {task.rewardDescription}</Text>
            </View>
          )}

          {bexUser && bexUser.role === 'user' ? (
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {t('applyScreen.statsRow', {
                  reputation: bexUser.reputationScore ?? 0,
                  completed: bexUser.completedTaskCount ?? 0,
                })}
              </Text>
            </View>
          ) : null}

          {portfolio.length > 0 ? (
            <UserPortfolioGallery
              items={portfolio}
              title={t('applyScreen.portfolioTitle')}
              subtitle={t('applyScreen.portfolioSubtitle')}
              compact
            />
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label={t('applyScreen.coverLetterLabel')}
            placeholder={t('applyScreen.coverLetterPlaceholder')}
            value={coverLetter}
            onChangeText={setCoverLetter}
            multiline
            numberOfLines={5}
          />

          <Input
            label={t('applyScreen.portfolioUrlLabel')}
            placeholder="https://..."
            value={portfolioUrl}
            onChangeText={setPortfolioUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Button
            title={t('applyScreen.submit')}
            onPress={handleSubmit}
            loading={loading}
            disabled={!task || !isTaskOpenForApplications(task)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[5], paddingBottom: Spacing[10] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskPreview: {
    padding: Spacing[4],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    gap: Spacing[2],
  },
  taskTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  taskReward: { ...Typography.bodySmall, color: Colors.textSecondary },
  statsRow: {
    backgroundColor: Colors.surface,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statText: { ...Typography.bodySmall, color: Colors.textSecondary },
  errorBox: {
    backgroundColor: Colors.errorLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
}));
