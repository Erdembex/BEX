import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useFocusEffect, useLocalSearchParams, Href } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, tasksRepository, couponsRepository } from '@/features/data';
import { Application, Coupon } from '@/types';
import { useApplicationStatusLabels } from '@/constants/taskLabels';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { ApplicationProgress } from '@/components/application/ApplicationProgress';
import { ApplicationMessageThread } from '@/components/application/ApplicationMessageThread';
import { SubmissionProofSection } from '@/components/application/SubmissionProofSection';
import { useToast } from '@/components/common/Toast';
import { refreshPendingFeedbackGate } from '@/components/feedback/PendingFeedbackGate';
import { getApplicationTimeline } from '@/lib/applicationTimeline';
import { canUseApplicationMessages } from '@/features/messages';
import { isCurrentApplicationOwner } from '@/features/application/applicationsApi';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

export default function ApplicationDetailScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const APPLICATION_STATUS_LABELS = useApplicationStatusLabels();
  const STATUS_HINTS: Partial<Record<Application['status'], string>> = {
    pending: t('applicationDetailScreen.hintPending'),
    approved: t('applicationDetailScreen.hintApproved'),
    submitted: t('applicationDetailScreen.hintSubmitted'),
    submission_approved: t('applicationDetailScreen.hintSubmissionApproved'),
    rewarded: t('applicationDetailScreen.hintRewarded'),
    rejected: t('applicationDetailScreen.hintRejected'),
    cancelled: t('applicationDetailScreen.hintCancelled'),
  };
  const { id } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser, bexUser } = useAuthStore();
  const { showToast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const app = await applicationsRepository.getById(id);
    setApplication(app);
    if (app && firebaseUser) {
      setIsOwner(await isCurrentApplicationOwner(app.userId, firebaseUser.uid));
    } else {
      setIsOwner(false);
    }
    if (app) {
      const task = await tasksRepository.getById(app.taskId);
      setTaskTitle(task?.title ?? t('applicationDetailScreen.defaultTask'));
      if (app.status === 'rewarded') {
        const c = await couponsRepository.getByApplicationId(app.id);
        setCoupon(c);
        if (!app.feedbackSubmitted) {
          refreshPendingFeedbackGate();
        }
      } else {
        setCoupon(null);
      }
    }
    setLoading(false);
  }, [id, firebaseUser?.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const needsFeedback =
    !!application &&
    isOwner &&
    application.status === 'rewarded' &&
    !application.feedbackSubmitted;

  const canCancel =
    application &&
    firebaseUser &&
    isOwner &&
    ['pending', 'approved'].includes(application.status);

  const handleCancel = () => {
    if (!application || !firebaseUser) return;

    Alert.alert(
      t('applicationDetailScreen.cancelTitle'),
      t('applicationDetailScreen.cancelBody'),
      [
        { text: t('applicationDetailScreen.cancelDismiss'), style: 'cancel' },
        {
          text: t('applicationDetailScreen.cancelConfirm'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            const ok = await applicationsRepository.cancel(application.id, firebaseUser.uid);
            setCancelling(false);
            if (ok) {
              showToast(t('applicationDetailScreen.cancelledToast'));
              await load();
            } else {
              showToast(t('applicationDetailScreen.cancelFailedToast'));
            }
          },
        },
      ]
    );
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
        <Text style={styles.error}>{t('applicationDetailScreen.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('applicationDetailScreen.backLink')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusHint = STATUS_HINTS[application.status];

  return (
    <Screen style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('applicationDetailScreen.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('applicationDetailScreen.title')}</Text>
        <Text style={styles.taskTitle}>{taskTitle}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Text>
        </View>

        <ApplicationProgress status={application.status} />

        {statusHint ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{statusHint}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>{t('applicationDetailScreen.process')}</Text>
        <View style={styles.timeline}>
          {getApplicationTimeline(application).map((event, index) => (
            <View key={`${event.label}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>{event.label}</Text>
                {event.relative ? (
                  <Text style={styles.timelineTime}>{event.relative}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {application.status === 'approved' && application.reviewNote ? (
          <View style={[styles.infoBox, { borderLeftColor: Colors.warning }]}>
            <Text style={styles.infoLabel}>{t('applicationDetailScreen.adminNote')}</Text>
            <Text style={styles.infoText}>{application.reviewNote}</Text>
          </View>
        ) : null}

        <Text style={styles.section}>{t('applicationDetailScreen.coverLetter')}</Text>
        <Text style={styles.body}>{application.coverLetter || '—'}</Text>

        {application.portfolioUrl ? (
          <>
            <Text style={styles.section}>{t('applicationDetailScreen.portfolio')}</Text>
            <Text style={styles.link}>{application.portfolioUrl}</Text>
          </>
        ) : null}

        {application.submissionText ? (
          <>
            <Text style={styles.section}>{t('applicationDetailScreen.submissionDescription')}</Text>
            <Text style={styles.body}>{application.submissionText}</Text>
          </>
        ) : null}

        <SubmissionProofSection
          photos={application.submissionFiles}
          attachments={application.submissionAttachments}
          links={application.submissionLinks}
        />

        {application.status === 'rewarded' && coupon ? (
          <View style={styles.couponBox}>
            <Text style={styles.couponLabel}>{t('applicationDetailScreen.couponCode')}</Text>
            <Text style={styles.couponCode}>{coupon.couponCode}</Text>
            <Button
              title={t('applicationDetailScreen.openInWallet')}
              variant="secondary"
              onPress={() => router.push('/(tabs)/wallet' as Href)}
            />
          </View>
        ) : null}

        {['submission_approved', 'rewarded'].includes(application.status) &&
        application.submissionFiles.length > 0 ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {t('applicationDetailScreen.portfolioNote')}
            </Text>
          </View>
        ) : null}

        {['approved', 'submitted', 'submission_approved', 'rewarded'].includes(
          application.status
        ) &&
        isOwner ? (
          <Button
            title={t('applicationDetailScreen.reportBusiness')}
            variant="outline"
            onPress={() =>
              router.push({
                pathname: '/complaint/submit',
                params: {
                  businessId: application.businessId,
                  applicationId: application.id,
                  applicationLabel: `${taskTitle}`,
                },
              } as never)
            }
          />
        ) : null}

        {needsFeedback ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('applicationDetailScreen.feedbackRequired')}</Text>
          </View>
        ) : null}

        {application.status === 'rewarded' &&
        isOwner &&
        application.feedbackSubmitted ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{t('applicationDetailScreen.feedbackSubmitted')}</Text>
          </View>
        ) : null}

        {firebaseUser &&
        bexUser &&
        canUseApplicationMessages(application.status) ? (
          <>
            <ApplicationMessageThread
              applicationId={application.id}
              currentUserId={firebaseUser.uid}
              currentUserRole={bexUser.role}
            />
            <Button
              title={t('applicationDetailScreen.openFullChat')}
              variant="outline"
              onPress={() =>
                router.push(`/(tabs)/messages/${application.id}` as Href)
              }
            />
          </>
        ) : null}

        {canCancel && (
          <Button
            title={t('applicationDetailScreen.cancelApplication')}
            variant="outline"
            onPress={handleCancel}
            loading={cancelling}
            style={styles.cancelBtn}
            textStyle={{ color: Colors.error }}
          />
        )}

        {application.status === 'approved' && (
          <Button
            title={t('applicationDetailScreen.submitTask')}
            onPress={() => router.push(`/task/submit/${application.id}` as Href)}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  backLink: { ...Typography.labelMedium, color: Colors.primary },
  error: { ...Typography.bodyMedium, color: Colors.error },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  taskTitle: { ...Typography.bodyLarge, color: Colors.textSecondary },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
  },
  statusText: { ...Typography.labelMedium, color: Colors.primary },
  section: { ...Typography.labelLarge, color: Colors.textPrimary, marginTop: Spacing[2] },
  body: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  link: { ...Typography.bodySmall, color: Colors.info },
  cancelBtn: { marginTop: Spacing[2], borderColor: Colors.error },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing[1],
  },
  infoLabel: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },
  infoText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  fileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  fileImage: {
    width: 88,
    height: 88,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  couponBox: {
    backgroundColor: Colors.success + '14',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.success,
    gap: Spacing[3],
  },
  couponLabel: { ...Typography.caption, color: Colors.textMuted },
  couponCode: {
    ...Typography.headingMedium,
    color: Colors.success,
    letterSpacing: 1,
  },
  timeline: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[3],
  },
  timelineRow: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  timelineContent: { flex: 1, gap: 2 },
  timelineLabel: { ...Typography.bodySmall, color: Colors.textPrimary },
  timelineTime: { ...Typography.caption, color: Colors.textMuted },
}));
