import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { ImagePreviewGrid } from '@/components/common/ImagePreviewGrid';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Typography, Spacing, Radius, createThemedStyles } from '@/theme';
import { useTranslation } from '@/i18n';

type Props = {
  photos?: string[];
  attachments?: string[];
  links?: string[];
};

export function SubmissionProofSection({ photos = [], attachments = [], links = [] }: Props) {
  const styles = useStyles();
  const { t } = useTranslation();

  if (photos.length === 0 && attachments.length === 0 && links.length === 0) {
    return null;
  }

  return (
    <>
      {photos.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.title}>{t('submissionProof.photosTitle')}</Text>
          <ImagePreviewGrid urls={photos} />
        </View>
      ) : null}

      {attachments.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.title}>{t('submissionProof.attachmentsTitle')}</Text>
          {attachments.map((url) => {
            const resolved = resolveMediaUrl(url);
            return (
            <TouchableOpacity
              key={url}
              style={styles.row}
              onPress={() => void Linking.openURL(resolved).catch(() => undefined)}
            >
              <Text style={styles.link} numberOfLines={2}>
                {fileLabel(url)}
              </Text>
            </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {links.length > 0 ? (
        <View style={styles.block}>
          <Text style={styles.title}>{t('submissionProof.linksTitle')}</Text>
          {links.map((link) => (
            <TouchableOpacity
              key={link}
              style={styles.row}
              onPress={() => void Linking.openURL(link).catch(() => undefined)}
            >
              <Text style={styles.link} numberOfLines={2}>
                {link}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </>
  );
}

function fileLabel(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] || url;
}

const useStyles = createThemedStyles((Colors) => ({
  block: { gap: Spacing[2] },
  title: { ...Typography.labelMedium, color: Colors.textPrimary },
  row: {
    padding: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  link: { ...Typography.bodySmall, color: Colors.primary },
}));
