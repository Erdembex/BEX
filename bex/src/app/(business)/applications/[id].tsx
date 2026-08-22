import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Linking, Alert } from 'react-native';
import { Screen, useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { router, useLocalSearchParams, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import {
  applicationsRepository,
  tasksRepository,
  approveApplication,
  issueCouponForSubmission,
  usersRepository,
} from '@/features/data';
import { Application, Task, PortfolioItem } from '@/types';
import { useApplicationStatusLabels } from '@/constants/taskLabels';
import { Button, Input } from '@/components/ui';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { SubmissionProofSection } from '@/components/application/SubmissionProofSection';
import { ApplicationMessageThread } from '@/components/application/ApplicationMessageThread';
import { canUseApplicationMessages } from '@/features/messages';
import { useToast } from '@/components/common/Toast';
import { refreshPendingFeedbackGate } from '@/components/feedback/PendingFeedbackGate';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function ApplicationDetailScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const insets = useResolvedSafeAreaInsets();
  const { t } = useTranslation();
  const APPLICATION_STATUS_LABELS = useApplicationStatusLabels();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser, bexUser } = useAuthStore();
  const { showToast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantPortfolio, setApplicantPortfolio] = useState<PortfolioItem[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const app = await applicationsRepository.getById(id);
      setApplication(app);
      if (app) {
        const t = await tasksRepository.getById(app.taskId);
        setTask(t);
        setApplicantName(await usersRepository.getDisplayName(app.userId));
        setApplicantPortfolio(await usersRepository.getPortfolio(app.userId));
      }
    } catch (err: unknown) {
      setApplication(null);
      Alert.alert(
        t('applicationDetailBizScreen.loadFailedTitle'),
        err instanceof Error ? err.message : t('applicationDetailBizScreen.loadFailedText')
      );
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const needsFeedback =
    !!application &&
    application.status === 'rewarded' &&
    !application.feedbackSubmitted;

  const handleApproveApplication = async () => {
    if (!application || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await approveApplication(application.id, reviewNote);
      if (updated) {
        setApplication(updated);
        setReviewNote('');
        showToast(t('applicationDetailBizScreen.approvedToast'));
        return;
      }

      const fresh = await applicationsRepository.getById(application.id);
      if (fresh && fresh.status !== 'pending') {
        setApplication(fresh);
        showToast(t('applicationDetailBizScreen.alreadyApprovedToast'));
        return;
      }

      Alert.alert(t('applicationDetailBizScreen.cannotApproveTitle'), t('applicationDetailBizScreen.cannotApproveText'));
    } catch (err: unknown) {
      const fresh = await applicationsRepository.getById(application.id).catch(() => null);
      if (fresh && fresh.status !== 'pending') {
        setApplication(fresh);
        showToast(t('applicationDetailBizScreen.approvedToast2'));
        return;
      }
      Alert.alert(
        t('applicationDetailBizScreen.errorTitle'),
        err instanceof Error ? err.message : t('applicationDetailBizScreen.genericActionFailed')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueCoupon = async () => {
    if (!application || !firebaseUser || actionLoading) return;
    setActionLoading(true);
    try {
      const coupon = await issueCouponForSubmission(
        application.id,
        firebaseUser.uid,
        reviewNote
      );
      if (coupon) {
        const fresh = await applicationsRepository.getById(application.id);
        if (fresh) setApplication(fresh);
        setReviewNote('');
        showToast(t('applicationDetailBizScreen.couponCreatedToast', { code: coupon.couponCode }));
        refreshPendingFeedbackGate();
        return;
      }
      Alert.alert(t('applicationDetailBizScreen.couponFailedTitle'), t('applicationDetailBizScreen.couponFailedText'));
    } catch (err: unknown) {
      Alert.alert(
        t('applicationDetailBizScreen.errorTitle'),
        err instanceof Error ? err.message : t('applicationDetailBizScreen.genericActionFailed')
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!application || actionLoading) return;
    setActionLoading(true);
    try {
      await applicationsRepository.updateStatus(
        application.id,
        'rejected',
        reviewNote || t('applicationDetailBizScreen.rejectedDefaultReason')
      );
      const fresh = await applicationsRepository.getById(application.id);
      if (fresh) setApplication(fresh);
      showToast(t('applicationDetailBizScreen.rejectedToast'));
    } catch {
      Alert.alert(t('applicationDetailBizScreen.errorTitle'), t('applicationDetailBizScreen.genericActionFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!application) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('applicationDetailBizScreen.notFound')}</Text>
      </View>
    );
  }

  const canApproveApplication = application.status === 'pending';
  const awaitingAdminReview = application.status === 'submitted';
  const canIssueCoupon = application.status === 'submission_approved';

  const renderStickyActions = () => (
    <View style={styles.decisionActions}>
      <Button
        title={t('applicationDetailBizScreen.approveApplication')}
        onPress={handleApproveApplication}
        loading={actionLoading}
        size="md"
        style={styles.decisionBtn}
        fullWidth={false}
      />
      <Button
        title={t('applicationDetailBizScreen.reject')}
        variant="danger"
        onPress={handleReject}
        loading={actionLoading}
        disabled={actionLoading}
        size="md"
        style={styles.decisionBtn}
        fullWidth={false}
      />
    </View>
  );

  return (
    <Screen style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('applicationDetailBizScreen.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{t('applicationDetailBizScreen.screenTitle')}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.body}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          canApproveApplication ? styles.scrollWithFooter : null,
        ]}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Text>
        </View>

        <Text style={styles.taskTitle}>{task?.title ?? t('applicationDetailBizScreen.defaultTask')}</Text>

        {canApproveApplication ? (
          <View style={styles.decisionCard}>
            <Text style={styles.decisionTitle}>{t('applicationDetailBizScreen.decisionTitle')}</Text>
            <Text style={styles.applicantCardTitle}>
              {t('applicationDetailBizScreen.applicantLabel', {
                name: applicantName || application.userId.slice(0, 8),
              })}
            </Text>
            <Input
              label={t('applicationDetailBizScreen.reviewNoteLabel')}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder={t('applicationDetailBizScreen.reviewNotePlaceholder')}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <Text style={styles.secondaryLabel}>{t('applicationDetailBizScreen.secondaryActionsLabel')}</Text>
            <View style={styles.secondaryActions}>
              <Button
                title={t('applicationDetailBizScreen.viewApplicantProfile')}
                variant="outline"
                size="sm"
                onPress={() =>
                  router.push({ pathname: '/user/[id]', params: { id: application.userId } } as Href)
                }
                style={styles.secondaryBtn}
                fullWidth={false}
              />
              {firebaseUser && bexUser ? (
                <Button
                  title={t('applicationDetailBizScreen.messageApplicant')}
                  variant="outline"
                  size="sm"
                  onPress={() =>
                    router.push(`/(business)/messages/${application.id}` as Href)
                  }
                  style={styles.secondaryBtn}
                  fullWidth={false}
                />
              ) : null}
            </View>
          </View>
        ) : (
          <Text style={styles.meta}>
            {t('applicationDetailBizScreen.applicantLabel', {
              name: applicantName || application.userId.slice(0, 8),
            })}
          </Text>
        )}

        {canApproveApplication ? (
          <>
            <UserPortfolioGallery
              items={applicantPortfolio}
              title={t('applicationDetailBizScreen.approvedPortfolioTitle')}
              subtitle={t('applicationDetailBizScreen.approvedPortfolioSubtitle')}
              emptyText={t('applicationDetailBizScreen.approvedPortfolioEmpty')}
            />
          </>
        ) : null}

        {firebaseUser &&
        bexUser &&
        canUseApplicationMessages(application.status) ? (
          <>
            <ApplicationMessageThread
              applicationId={application.id}
              currentUserId={firebaseUser.uid}
              currentUserRole={bexUser.role}
              peerLabel={applicantName}
              taskTitle={task?.title}
            />
            <Button
              title={t('applicationDetailBizScreen.openChatFullscreen')}
              variant="outline"
              onPress={() =>
                router.push(`/(business)/messages/${application.id}` as Href)
              }
            />
          </>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.blockTitle}>{t('applicationDetailBizScreen.coverLetterTitle')}</Text>
          <Text style={styles.blockText}>{application.coverLetter || '—'}</Text>
        </View>

        {application.portfolioUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(application.portfolioUrl!)}
          >
            <Text style={styles.link}>{t('applicationDetailBizScreen.openPortfolioLink')}</Text>
          </TouchableOpacity>
        ) : null}

        {application.submissionText ? (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>{t('applicationDetailBizScreen.submissionDescTitle')}</Text>
            <Text style={styles.blockText}>{application.submissionText}</Text>
          </View>
        ) : null}

        <SubmissionProofSection
          photos={application.submissionFiles}
          attachments={application.submissionAttachments}
          links={application.submissionLinks}
        />

        {awaitingAdminReview && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              {t('applicationDetailBizScreen.awaitingAdminReview')}
            </Text>
          </View>
        )}

        {application.status === 'submission_approved' && (
          <View style={[styles.waitingBox, { backgroundColor: Colors.success + '18' }]}>
            <Text style={styles.waitingText}>
              {t('applicationDetailBizScreen.submissionApprovedHint')}
            </Text>
          </View>
        )}

        {application.status === 'approved' && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              {t('applicationDetailBizScreen.awaitingSubmissionHint')}
            </Text>
          </View>
        )}

        {canIssueCoupon && (
          <>
            <Input
              label={t('applicationDetailBizScreen.submissionReviewNoteLabel')}
              value={reviewNote}
              onChangeText={setReviewNote}
              placeholder={t('applicationDetailBizScreen.couponNotePlaceholder')}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
            <View style={styles.actions}>
              <Button
                title={t('applicationDetailBizScreen.approveAndIssueCoupon')}
                onPress={handleIssueCoupon}
                loading={actionLoading}
              />
            </View>
          </>
        )}

        {['submission_approved', 'rewarded', 'approved', 'submitted'].includes(
          application.status
        ) ? (
          <>
            {application.status === 'rewarded' ? (
              application.feedbackSubmitted ? (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingText}>
                    {t('applicationDetailBizScreen.feedbackSubmitted')}
                  </Text>
                </View>
              ) : needsFeedback ? (
                <View style={styles.waitingBox}>
                  <Text style={styles.waitingText}>
                    {t('applicationDetailBizScreen.feedbackRequired')}
                  </Text>
                </View>
              ) : null
            ) : null}
            <Button
              title={t('applicationDetailBizScreen.reportUser')}
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/complaint/submit-user',
                  params: {
                    applicationId: application.id,
                    applicationLabel: `${task?.title ?? t('applicationDetailBizScreen.defaultTask')} · ${applicantName}`,
                  },
                })
              }
            />
          </>
        ) : null}
      </ScrollView>

      {canApproveApplication ? (
        <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, Spacing[3]) }]}>
          {renderStickyActions()}
        </View>
      ) : null}
      </View>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
  },
  back: { ...Typography.labelMedium, color: Colors.textSecondary },
  screenTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  body: { flex: 1 },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  scrollWithFooter: { paddingBottom: 120 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    marginBottom: Spacing[3],
  },
  badgeText: { ...Typography.labelMedium, color: Colors.primaryDark },
  taskTitle: { ...Typography.headingLarge, color: Colors.textPrimary, marginBottom: Spacing[1] },
  meta: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing[5] },
  decisionCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    borderWidth: 2,
    borderColor: Colors.borderGold,
    gap: Spacing[3],
  },
  decisionTitle: {
    ...Typography.labelMedium,
    color: Colors.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  applicantCardTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  decisionActions: { flexDirection: 'row', gap: Spacing[3] },
  decisionBtn: { flex: 1 },
  secondaryLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: Spacing[1],
  },
  secondaryActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  secondaryBtn: { flex: 1, minWidth: 132 },
  stickyFooter: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderGold,
  },
  block: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  blockTitle: { ...Typography.labelMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  blockText: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  link: { ...Typography.labelMedium, color: Colors.primary, marginBottom: Spacing[4] },
  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  fileImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  file: { ...Typography.bodySmall, color: Colors.textSecondary },
  waitingBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    marginBottom: Spacing[3],
  },
  waitingText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  actions: { gap: Spacing[3], marginTop: Spacing[4] },
  errorText: { ...Typography.bodyMedium, color: Colors.error },
}));
