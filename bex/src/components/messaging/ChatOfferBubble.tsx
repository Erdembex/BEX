import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ChatOffer } from '@/types';
import { formatOfferLabel } from '@/features/messages/offersApi';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { androidReadableText } from '@/lib/readableTextStyle';
import { Timestamp } from 'firebase/firestore';
import { useTranslation } from '@/i18n';

type ChatOfferBubbleProps = {
  offer: ChatOffer;
  mine: boolean;
  createdAt: Timestamp;
  onAccept?: () => void;
  onReject?: () => void;
  acting?: boolean;
};

export function ChatOfferBubble({
  offer,
  mine,
  createdAt,
  onAccept,
  onReject,
  acting,
}: ChatOfferBubbleProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    PENDING: { label: t('chatOfferBubble.statusPending'), color: Colors.accentDark },
    ACCEPTED: { label: t('chatOfferBubble.statusAccepted'), color: Colors.moneyGreen },
    REJECTED: { label: t('chatOfferBubble.statusRejected'), color: Colors.textMuted },
    COUNTERED: { label: t('chatOfferBubble.statusCountered'), color: Colors.info },
  };

  const rewardSummary = (o: ChatOffer): string => {
    const typeLabels: Record<string, string> = {
      COFFEE: t('chatOfferBubble.rewardCoffee'),
      GYM_MEMBERSHIP: t('chatOfferBubble.rewardGym'),
      PRODUCT: t('chatOfferBubble.rewardProduct'),
      DISCOUNT: t('chatOfferBubble.rewardDiscount'),
      CUSTOM: t('chatOfferBubble.rewardCustom'),
    };
    const typeLabel = typeLabels[o.rewardType.toUpperCase()] ?? t('chatOfferBubble.rewardCustom');
    return `${o.quantity} ${o.unit} · ${typeLabel}`;
  };

  const status = STATUS_LABEL[offer.status] ?? STATUS_LABEL.PENDING;
  const canRespond = !mine && offer.status === 'PENDING' && onAccept && onReject;
  const title = offer.listingTitle || formatOfferLabel(offer);

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.card, mine ? styles.cardMine : styles.cardOther]}>
        <Text style={[styles.badge, mine && styles.badgeMine]}>{t('chatOfferBubble.badgeLabel')}</Text>
        <Text
          style={[styles.jobTitle, mine && styles.textOnGold]}
          numberOfLines={3}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {offer.listingDescription ? (
          <Text
            style={[styles.description, mine && styles.descriptionMine]}
            numberOfLines={4}
            ellipsizeMode="tail"
          >
            {offer.listingDescription}
          </Text>
        ) : null}
        <Text style={[styles.reward, mine && styles.textOnGold]}>
          {t('chatOfferBubble.rewardLabel', { summary: rewardSummary(offer) })}
        </Text>
        {offer.note ? (
          <Text
            style={[styles.note, mine && styles.noteMine]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {offer.note}
          </Text>
        ) : null}
        <Text style={[styles.meta, mine && styles.metaMine]}>
          {t('chatOfferBubble.validityLabel', { days: offer.validityDays })}
          <Text style={{ color: mine ? Colors.textOnGold : status.color, fontWeight: '600' }}>
            {status.label}
          </Text>
        </Text>
        {offer.status === 'ACCEPTED' && !mine && offer.resultApplicationId ? (
          <TouchableOpacity
            style={styles.actionLink}
            onPress={() => router.push(`/task/submit/${offer.resultApplicationId}`)}
            activeOpacity={0.88}
          >
            <Text style={styles.actionLinkText}>{t('chatOfferBubble.submitWork')}</Text>
          </TouchableOpacity>
        ) : null}
        {canRespond ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={onReject}
              disabled={acting}
              activeOpacity={0.88}
            >
              {acting ? (
                <ActivityIndicator color={Colors.textSecondary} size="small" />
              ) : (
                <Text style={styles.rejectText}>{t('chatOfferBubble.reject')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.acceptBtn]}
              onPress={onAccept}
              disabled={acting}
              activeOpacity={0.88}
            >
              {acting ? (
                <ActivityIndicator color={Colors.textOnPrimary} size="small" />
              ) : (
                <Text style={styles.acceptText}>{t('chatOfferBubble.acceptWork')}</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
        <Text style={[styles.time, mine && styles.timeMine]}>
          {formatRelativeTime(createdAt) || t('chatOfferBubble.justNow')}
        </Text>
      </View>
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  row: { width: '100%', marginBottom: Spacing[2] },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  card: {
    maxWidth: '92%',
    minWidth: 0,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
    gap: Spacing[2],
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.borderGold,
    borderBottomRightRadius: Radius.xs,
  },
  cardOther: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.borderGold,
    borderBottomLeftRadius: Radius.xs,
  },
  badge: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  badgeMine: { color: Colors.textOnGold },
  jobTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '700',
    flexShrink: 1,
    ...androidReadableText,
  },
  textOnGold: { color: Colors.textOnGold },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  descriptionMine: {
    color: Colors.textOnGold,
    opacity: 0.92,
  },
  reward: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  note: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  noteMine: {
    color: Colors.textOnGold,
    opacity: 0.88,
  },
  meta: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  metaMine: { color: Colors.textOnGold, opacity: 0.78 },
  actionLink: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.moneyGreenLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  actionLinkText: {
    ...Typography.caption,
    color: Colors.moneyGreen,
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[1], width: '100%' },
  btn: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  rejectBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  acceptBtn: { backgroundColor: Colors.moneyGreenDark },
  rejectText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  acceptText: { ...Typography.caption, color: Colors.white, fontWeight: '700' },
  time: { ...Typography.caption, color: Colors.textMuted, alignSelf: 'flex-end' },
  timeMine: { color: Colors.textOnGold, opacity: 0.72 },
}));
