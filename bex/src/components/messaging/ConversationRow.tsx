import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ConversationPreview } from '@/features/messages/inboxService';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface ConversationRowProps {
  item: ConversationPreview;
  onPress: () => void;
}

export function ConversationRow({ item, onPress }: ConversationRowProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const preview = item.lastMessage?.trim() || t('conversationRow.noMessageYet');
  const hasUnread = item.unreadCount > 0;

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.88} onPress={onPress}>
      <ProfileAvatar name={item.peerName} avatarUrl={item.peerAvatarUrl} size={52} />

      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text style={[styles.title, hasUnread && styles.titleUnread]} numberOfLines={1}>
            {item.peerName}
          </Text>
          {item.lastMessageAt ? (
            <Text style={styles.time}>{formatRelativeTime(item.lastMessageAt)}</Text>
          ) : null}
        </View>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {item.taskTitle}
        </Text>
        <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={2}>
          {preview}
        </Text>
      </View>

      {hasUnread ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.unreadCount > 99 ? '99+' : item.unreadCount}
          </Text>
        </View>
      ) : (
        <Text style={styles.chevron}>›</Text>
      )}
    </TouchableOpacity>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  body: { flex: 1, gap: 2 },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  titleUnread: { fontWeight: '800' },
  time: { ...Typography.caption, color: Colors.textMuted },
  taskTitle: {
    ...Typography.caption,
    color: Colors.accent,
    fontWeight: '700',
  },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  previewUnread: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 11,
  },
  chevron: {
    ...Typography.headingMedium,
    color: Colors.textMuted,
    fontWeight: '300',
  },
}));
