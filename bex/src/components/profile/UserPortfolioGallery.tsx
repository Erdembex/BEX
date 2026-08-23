import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { PortfolioItem } from '@/types';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - Spacing[5] * 2 - Spacing[2] * 2) / 3;

interface UserPortfolioGalleryProps {
  items: PortfolioItem[];
  title?: string;
  subtitle?: string;
  emptyText?: string;
  compact?: boolean;
  maxItems?: number;
}

export function UserPortfolioGallery({
  items,
  title,
  subtitle,
  emptyText,
  compact = false,
  maxItems,
}: UserPortfolioGalleryProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('userPortfolioGallery.title');
  const resolvedSubtitle = subtitle ?? t('userPortfolioGallery.subtitle');
  const [preview, setPreview] = useState<PortfolioItem | null>(null);
  const visibleItems = maxItems && maxItems > 0 ? items.slice(0, maxItems) : items;
  const hiddenCount = items.length - visibleItems.length;

  if (items.length === 0) {
    if (emptyText) {
      return (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>{resolvedTitle}</Text>
        {!compact && resolvedSubtitle ? (
          <Text style={styles.subtitle}>
            {hiddenCount > 0
              ? t('userPortfolioGallery.subtitleWithCount', { shown: visibleItems.length, total: items.length })
              : resolvedSubtitle}
          </Text>
        ) : null}
        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.thumbWrap}
              onPress={() => setPreview(item)}
              activeOpacity={0.9}
            >
              <AuthenticatedImage uri={item.imageUrl} style={styles.thumb} />
              {!compact ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.taskTitle}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ImageViewerModal
        visible={!!preview}
        uri={preview?.imageUrl ?? null}
        onClose={() => setPreview(null)}
        caption={preview?.taskTitle}
        zoomHint={t('userPortfolioGallery.zoomHint')}
      />
    </>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  title: { ...Typography.labelLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  thumbWrap: { width: THUMB_SIZE, gap: 4 },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  caption: { ...Typography.caption, color: Colors.textSecondary },
  emptyBox: {
    width: '100%',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
}));
