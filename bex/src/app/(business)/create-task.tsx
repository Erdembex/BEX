import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from "expo-router/react-navigation";
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useBusiness } from '@/features/business/useBusiness';
import { tasksRepository } from '@/features/data';
import { demoStore } from '@/lib/demoStore';
import { shouldUseDemoData } from '@/lib/devMode';
import { TaskCategory, TaskDifficulty, CreateTask } from '@/types';
import { ALL_CATEGORIES, useCategoryLabels, useDifficultyLabels } from '@/constants/taskLabels';
import { StepIndicator } from '@/components/business';
import { Button, Input } from '@/components/ui';
import { useToast } from '@/components/common/Toast';
import { getListingLimitInfo, ListingLimitInfo } from '@/lib/listingLimit';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const DIFFICULTIES: TaskDifficulty[] = ['easy', 'medium', 'hard'];

interface FormState {
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedHours: string;
  rewardDescription: string;
  rewardQuantity: string;
  maxApplicants: string;
  deadlineDays: string;
}

const initialForm: FormState = {
  title: '',
  description: '',
  category: 'design',
  difficulty: 'medium',
  estimatedHours: '4',
  rewardDescription: '',
  rewardQuantity: '1',
  maxApplicants: '3',
  deadlineDays: '14',
};

export default function CreateTaskScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { business, loading: businessLoading } = useBusiness();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const CATEGORY_LABELS = useCategoryLabels();
  const DIFFICULTY_LABELS = useDifficultyLabels();
  const STEPS = useMemo(
    () => [
      t('createTask.steps.basic'),
      t('createTask.steps.reward'),
      t('createTask.steps.requirements'),
      t('createTask.steps.preview'),
    ],
    [t]
  );
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [limitInfo, setLimitInfo] = useState<ListingLimitInfo | null>(null);
  const [limitLoading, setLimitLoading] = useState(true);
  const submitLock = useRef(false);

  const resetCreateForm = useCallback(() => {
    setStep(0);
    setForm(initialForm);
    setSubmitted(false);
    setLoading(false);
    setError('');
    submitLock.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetCreateForm();
      if (!business?.id) return;
      setLimitLoading(true);
      void getListingLimitInfo(business.id)
        .then(setLimitInfo)
        .finally(() => setLimitLoading(false));
    }, [business?.id, resetCreateForm])
  );

  useEffect(() => {
    if (businessLoading) return;
    if (!business?.id) {
      setLimitLoading(false);
      return;
    }
    setLimitLoading(true);
    void getListingLimitInfo(business.id)
      .then(setLimitInfo)
      .finally(() => setLimitLoading(false));
  }, [business?.id, businessLoading]);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const validateStep = (): boolean => {
    setError('');
    if (step === 0) {
      if (form.title.trim().length < 5) {
        setError(t('createTask.titleMinLength'));
        return false;
      }
      if (form.description.trim().length < 20) {
        setError(t('createTask.descriptionMinLength'));
        return false;
      }
    }
    if (step === 1 && !form.rewardDescription.trim()) {
      setError(t('createTask.rewardRequired'));
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (loading || submitted || submitLock.current) return;
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else void handleSubmit();
  };

  const navigateAfterCreate = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(business)/tasks');
    }
  };

  const validateAll = (): boolean => {
    if (form.title.trim().length < 5) {
      setError(t('createTask.titleMinLength'));
      return false;
    }
    if (form.description.trim().length < 20) {
      setError(t('createTask.descriptionMinLength'));
      return false;
    }
    if (!form.rewardDescription.trim()) {
      setError(t('createTask.rewardRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!business || !validateAll() || loading || submitted || submitLock.current) return;
    if (limitInfo && !limitInfo.canCreate) {
      setError(
        t('createTask.limitReached', {
          active: limitInfo.active,
          max: Number.isFinite(limitInfo.max) ? limitInfo.max : '∞',
        })
      );
      return;
    }

    submitLock.current = true;
    setLoading(true);
    setError('');

    try {
      const loc = shouldUseDemoData()
        ? demoStore.defaultLocation
        : business.location;

      const data: CreateTask = {
        businessId: business.id,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        difficulty: form.difficulty,
        estimatedHours: parseInt(form.estimatedHours, 10) || 1,
        rewardDescription: form.rewardDescription.trim(),
        rewardQuantity: parseInt(form.rewardQuantity, 10) || 1,
        maxApplicants: parseInt(form.maxApplicants, 10) || 1,
        status: 'active',
        location: loc,
        deadline: Timestamp.fromDate(
          new Date(Date.now() + parseInt(form.deadlineDays, 10) * 86400000)
        ),
      };

      await tasksRepository.createAndPublish(business.id, data);
      showToast(t('createTaskScreen.createSuccessToast'));
      resetCreateForm();
      navigateAfterCreate();
    } catch (err: unknown) {
      submitLock.current = false;
      setLoading(false);
      let message =
        err instanceof Error ? err.message : t('createTaskScreen.createFailedDefault');
      if (/plan limit|aktif görev/i.test(message)) {
        message += t('createTaskScreen.createFailedLimitHint');
      }
      if (__DEV__) {
        console.error('[create-task] submit failed:', err);
      }
      setError(message);
      showToast(message);
    }
  };

  if (limitLoading || businessLoading) {
    return (
      <Screen style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('createTask.title')}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.limitBlockWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </Screen>
    );
  }

  if (limitInfo && !limitInfo.canCreate) {
    const maxLabel = Number.isFinite(limitInfo.max) ? limitInfo.max : '∞';
    return (
      <Screen style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('createTask.title')}</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.limitBlockWrap}>
          <Text style={styles.limitBlockEmoji}>🔒</Text>
          <Text style={styles.limitBlockTitle}>{t('createTask.limitTitle')}</Text>
          <Text style={styles.limitBlockText}>
            {t('createTask.limitText', {
              plan: limitInfo.planLabel,
              max: maxLabel,
              active: limitInfo.active,
            })}
          </Text>
          <Button
            title={t('createTask.upgradePlan')}
            onPress={() => router.push('/(business)/subscription')}
            style={styles.limitBlockBtn}
          />
          <Button
            title={t('createTask.backToTasks')}
            variant="outline"
            onPress={() => router.replace('/(business)/tasks')}
            style={styles.limitBlockBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('createTask.title')}</Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <StepIndicator steps={STEPS} currentStep={step} />

          {limitInfo ? (
            <View style={styles.limitBanner}>
              <Text style={styles.limitBannerTitle}>
                {t('createTask.limitBanner', {
                  plan: limitInfo.planLabel,
                  active: limitInfo.active,
                  max: Number.isFinite(limitInfo.max) ? limitInfo.max : '∞',
                })}
              </Text>
              <Text style={styles.limitBannerHint}>{t('createTask.limitBannerOk')}</Text>
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {step === 0 && (
            <View style={styles.section}>
              {business?.address ? (
                <View style={styles.locationBanner}>
                  <Text style={styles.locationBannerTitle}>{t('createTaskScreen.locationBannerTitle')}</Text>
                  <Text style={styles.locationBannerText}>{business.address}</Text>
                  <Text style={styles.locationBannerHint}>
                    {t('createTaskScreen.locationBannerHint')}
                  </Text>
                </View>
              ) : null}
              <Input
                label={t('createTaskScreen.titleLabel')}
                value={form.title}
                onChangeText={(v) => update({ title: v })}
                placeholder={t('createTaskScreen.titlePlaceholder')}
              />
              <Input
                label={t('createTaskScreen.descriptionLabel')}
                value={form.description}
                onChangeText={(v) => update({ description: v })}
                placeholder={t('createTaskScreen.descriptionPlaceholder')}
                multiline
                numberOfLines={5}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <Text style={styles.fieldLabel}>{t('createTaskScreen.categoryLabel')}</Text>
              <View style={styles.chips}>
                {ALL_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, form.category === cat && styles.chipActive]}
                    onPress={() => update({ category: cat })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.category === cat && styles.chipTextActive,
                      ]}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>{t('createTaskScreen.difficultyLabel')}</Text>
              <View style={styles.chips}>
                {DIFFICULTIES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, form.difficulty === d && styles.chipActive]}
                    onPress={() => update({ difficulty: d })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.difficulty === d && styles.chipTextActive,
                      ]}
                    >
                      {DIFFICULTY_LABELS[d]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input
                label={t('createTaskScreen.estimatedHoursLabel')}
                value={form.estimatedHours}
                onChangeText={(v) => update({ estimatedHours: v })}
                keyboardType="number-pad"
              />
            </View>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <Input
                label={t('createTaskScreen.rewardDescriptionLabel')}
                value={form.rewardDescription}
                onChangeText={(v) => update({ rewardDescription: v })}
                placeholder={t('createTaskScreen.rewardDescriptionPlaceholder')}
              />
              <Input
                label={t('createTaskScreen.rewardQuantityLabel')}
                value={form.rewardQuantity}
                onChangeText={(v) => update({ rewardQuantity: v })}
                keyboardType="number-pad"
                hint={t('createTaskScreen.rewardQuantityHint')}
              />
              <Input
                label={t('createTaskScreen.maxApplicantsLabel')}
                value={form.maxApplicants}
                onChangeText={(v) => update({ maxApplicants: v })}
                keyboardType="number-pad"
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Input
                label={t('createTaskScreen.deadlineDaysLabel')}
                value={form.deadlineDays}
                onChangeText={(v) => update({ deadlineDays: v })}
                keyboardType="number-pad"
                hint={t('createTaskScreen.deadlineDaysHint')}
              />
            </View>
          )}

          {step === 3 && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>{form.title}</Text>
              <Text style={styles.previewDesc}>{form.description}</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('createTaskScreen.rewardLabel')}</Text>
                <Text style={styles.previewValue}>{form.rewardDescription}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('createTaskScreen.categoryLabel')}</Text>
                <Text style={styles.previewValue}>{CATEGORY_LABELS[form.category]}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>{t('createTaskScreen.difficultyLabel')}</Text>
                <Text style={styles.previewValue}>{DIFFICULTY_LABELS[form.difficulty]}</Text>
              </View>
              <View style={styles.previewNote}>
                <Text style={styles.previewNoteText}>
                  {t('createTaskScreen.previewNote')}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {step > 0 && (
              <Button
                title={t('createTaskScreen.back')}
                variant="outline"
                onPress={() => setStep(step - 1)}
                style={styles.halfBtn}
              />
            )}
            <Button
              title={submitted ? t('createTaskScreen.submittedButton') : step === STEPS.length - 1 ? t('createTaskScreen.publishButton') : t('createTaskScreen.nextButton')}
              onPress={handleNext}
              loading={loading}
              disabled={submitted}
              style={step > 0 ? styles.halfBtn : undefined}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  screenTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  section: { gap: Spacing[1] },
  limitBanner: {
    padding: Spacing[4],
    borderRadius: Radius.lg,
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.info,
    gap: Spacing[1],
    marginBottom: Spacing[3],
  },
  limitBannerTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  limitBannerHint: { ...Typography.caption, color: Colors.textSecondary },
  limitBlockWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[3],
  },
  limitBlockEmoji: { fontSize: 44, marginBottom: Spacing[2] },
  limitBlockTitle: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  limitBlockText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[2],
  },
  limitBlockBtn: { width: '100%' },
  locationBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    gap: Spacing[1],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  locationBannerTitle: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  locationBannerText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  locationBannerHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  fieldLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.labelMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textOnPrimary },
  preview: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[5],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  previewDesc: { ...Typography.bodyMedium, color: Colors.textSecondary, marginBottom: Spacing[4] },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  previewLabel: { ...Typography.bodySmall, color: Colors.textTertiary },
  previewValue: { ...Typography.labelMedium, color: Colors.textPrimary },
  previewNote: {
    marginTop: Spacing[4],
    backgroundColor: Colors.primaryLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
  },
  previewNoteText: { ...Typography.bodySmall, color: Colors.textSecondary },
  actions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[6] },
  halfBtn: { flex: 1 },
  error: { ...Typography.bodySmall, color: Colors.error, marginBottom: Spacing[3] },
}));
