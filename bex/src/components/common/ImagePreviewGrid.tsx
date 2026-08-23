import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { isPortfolioImageUrl } from '@/lib/portfolioUtils';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type PreviewItem = {
  id: string;
  uri: string;
  isImage: boolean;
};

interface ImagePreviewGridProps {
  urls: string[];
  thumbSize?: number;
}

export function ImagePreviewGrid({ urls, thumbSize = 88 }: ImagePreviewGridProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [preview, setPreview] = useState<PreviewItem | null>(null);

  const items = useMemo(() => {
    return urls
      .filter((url) => url?.trim())
      .map((url, index) => {
        const uri = resolveMediaUrl(url);
        return {
          id: `${index}-${uri}`,
          uri,
          isImage: isPortfolioImageUrl(uri),
        };
      });
  }, [urls]);

  if (items.length === 0) return null;

  return (
    <>
      <View style={styles.grid}>
        {items.map((item, index) =>
          item.isImage ? (
            <TouchableOpacity
              key={item.id}
              onPress={() => setPreview(item)}
              activeOpacity={0.85}
            >
              <AuthenticatedImage
                uri={item.uri}
                style={[styles.thumb, { width: thumbSize, height: thumbSize }]}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              key={item.id}
              onPress={() => Linking.openURL(item.uri)}
              style={styles.fileLink}
            >
              <Text style={styles.fileLinkText}>{t('imagePreviewGrid.file', { index: index + 1 })}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <ImageViewerModal
        visible={!!preview}
        uri={preview?.uri ?? null}
        onClose={() => setPreview(null)}
        zoomHint={t('imagePreviewGrid.zoomHint')}
      />
    </>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  thumb: {
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  fileLink: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fileLinkText: { ...Typography.bodySmall, color: Colors.primary },
}));
