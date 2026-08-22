import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { Button, Input } from '@/components/ui';
import { StarRatingInput } from '@/components/profile/StarRating';
import { Typography, Spacing, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface TaskFeedbackModalProps {
  visible: boolean;
  title: string;
  required?: boolean;
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => Promise<void>;
}

export function TaskFeedbackModal({
  visible,
  title,
  required = false,
  onClose,
  onSubmit,
}: TaskFeedbackModalProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const [step, setStep] = useState<'stars' | 'comment'>('stars');
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const reset = () => {
    setStep('stars');
    setStars(0);
    setComment('');
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (required) return;
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible || !required) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [visible, required]);

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  const handleContinue = () => {
    if (stars < 1) {
      setError(t('taskFeedbackModal.starsRequired'));
      return;
    }
    setError(null);
    setStep('comment');
  };

  const handleSubmit = async () => {
    if (stars < 1) {
      setError(t('taskFeedbackModal.starsRequiredSubmit'));
      if (!required) setStep('stars');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(stars, comment.trim());
      if (!required) handleClose();
      else reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('taskFeedbackModal.submitFailed'));
    } finally {
      setLoading(false);
    }
  };

  const subtitle = required
    ? t('taskFeedbackModal.subtitleRequired')
    : step === 'stars'
      ? t('taskFeedbackModal.subtitleStars')
      : t('taskFeedbackModal.subtitleComment');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={required ? () => {} : handleClose}
    >
      <Screen style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {!required ? (
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>{t('taskFeedbackModal.close')}</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          {required ? (
            <Text style={styles.requiredHint}>{t('taskFeedbackModal.requiredHint')}</Text>
          ) : null}
          <Text style={styles.subtitle}>{subtitle}</Text>

          {required || step === 'comment' ? (
            <>
              <StarRatingInput value={stars} onChange={setStars} size={required ? 32 : 24} />
              <Input
                label={t('taskFeedbackModal.commentLabel')}
                value={comment}
                onChangeText={setComment}
                placeholder={t('taskFeedbackModal.commentPlaceholder')}
                multiline
                numberOfLines={4}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title={t('taskFeedbackModal.submit')}
                onPress={handleSubmit}
                loading={loading}
                disabled={stars < 1}
              />
              {!required ? (
                <Button
                  title={t('taskFeedbackModal.backToStars')}
                  variant="ghost"
                  onPress={() => setStep('stars')}
                />
              ) : null}
            </>
          ) : (
            <>
              <StarRatingInput value={stars} onChange={setStars} />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button
                title={t('taskFeedbackModal.continue')}
                onPress={handleContinue}
                disabled={stars < 1}
              />
            </>
          )}
        </ScrollView>
      </Screen>
    </Modal>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[4], paddingBottom: Spacing[10] },
  close: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  requiredHint: { ...Typography.bodySmall, color: Colors.warning, lineHeight: 20 },
  subtitle: { ...Typography.bodyMedium, color: Colors.textMuted, lineHeight: 22 },
  error: { ...Typography.bodySmall, color: Colors.error },
}));
