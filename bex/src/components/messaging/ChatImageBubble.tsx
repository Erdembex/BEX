import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { saveChatImageToGallery } from '@/lib/saveImageToGallery';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type ChatImageBubbleProps = {
  mediaUrl: string;
  caption?: string;
  mine: boolean;
  createdAt: Timestamp;
  isRead?: boolean;
  onReport?: () => void;
};

export function ChatImageBubble({
  mediaUrl,
  caption,
  mine,
  createdAt,
  isRead,
  onReport,
}: ChatImageBubbleProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveToGallery = async () => {
    setMenuOpen(false);
    setSaving(true);
    try {
      await saveChatImageToGallery(mediaUrl);
      Alert.alert(t('chatImageBubble.savedTitle'), t('chatImageBubble.savedText'));
    } catch (err: unknown) {
      Alert.alert(
        t('chatImageBubble.saveFailedTitle'),
        err instanceof Error ? err.message : t('chatImageBubble.saveFailedText')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReportPress = () => {
    setMenuOpen(false);
    onReport?.();
  };

  return (
    <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Pressable onPress={() => setViewerOpen(true)} style={styles.imageWrap}>
          <AuthenticatedImage uri={mediaUrl} style={styles.image} />
          {saving ? (
            <View style={styles.savingOverlay}>
              <ActivityIndicator color={Colors.textOnPrimary} size="small" />
            </View>
          ) : null}
        </Pressable>

        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.8}
          accessibilityLabel={t('chatImageBubble.imageOptionsHint')}
        >
          <Text style={styles.menuDots}>⋮</Text>
        </TouchableOpacity>

        {caption && caption !== '📷 Fotoğraf' ? (
          <Text style={[styles.caption, mine && styles.captionMine]}>{caption}</Text>
        ) : null}
        <Text style={[styles.time, mine && styles.timeMine]}>
          {formatRelativeTime(createdAt) || t('chatImageBubble.justNow')}
          {mine && isRead ? t('chatImageBubble.readSuffix') : ''}
        </Text>
      </View>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSaveToGallery}>
              <Text style={styles.menuItemIcon}>🖼</Text>
              <Text style={styles.menuItemText}>{t('chatImageBubble.saveToGallery')}</Text>
            </TouchableOpacity>
            {onReport ? (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleReportPress}>
                  <Text style={styles.menuItemIcon}>🚩</Text>
                  <Text style={[styles.menuItemText, styles.menuItemDanger]}>{t('chatImageBubble.report')}</Text>
                </TouchableOpacity>
              </>
            ) : null}
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => setMenuOpen(false)}>
              <Text style={styles.menuItemText}>{t('chatImageBubble.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <ImageViewerModal
        visible={viewerOpen}
        uri={mediaUrl}
        onClose={() => setViewerOpen(false)}
        zoomHint={t('chatImageBubble.zoomHint')}
      />
    </View>
  );
}

type ChatImageAttachButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function ChatImageAttachButton({ onPress, disabled, loading }: ChatImageAttachButtonProps) {
  const styles = useScreenStyles();
  const Colors = useThemeColors();
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.attachBtn, (disabled || loading) && styles.attachBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityLabel={t('chatImageBubble.sendImageHint')}
    >
      {loading ? (
        <ActivityIndicator color={Colors.primary} size="small" />
      ) : (
        <Text style={styles.attachIcon}>🖼</Text>
      )}
    </TouchableOpacity>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  row: {
    width: '100%',
    marginBottom: Spacing[2],
  },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    borderRadius: Radius.xl,
    gap: Spacing[1],
    padding: Spacing[1],
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.xs,
  },
  imageWrap: {
    position: 'relative',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: 220,
    height: 220,
    borderRadius: Radius.lg,
    backgroundColor: Colors.borderLight,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDots: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 16,
  },
  caption: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing[2],
    lineHeight: 20,
  },
  captionMine: { color: Colors.textOnPrimary },
  time: {
    ...Typography.caption,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing[2],
    paddingBottom: Spacing[1],
  },
  timeMine: { color: Colors.textOnGold, opacity: 0.72 },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
  },
  menuCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  menuItemIcon: { fontSize: 18 },
  menuItemText: { ...Typography.bodyMedium, color: Colors.textPrimary, fontWeight: '600' },
  menuItemDanger: { color: Colors.error },
  menuDivider: { height: 1, backgroundColor: Colors.borderLight },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnDisabled: { opacity: 0.45 },
  attachIcon: { fontSize: 20 },
}));
