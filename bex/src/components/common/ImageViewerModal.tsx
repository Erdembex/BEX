import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZoomableImage } from '@/components/common/ZoomableImage';
import { Typography, Spacing, Radius } from '@/theme';
import { BRAND_GOLD_MID, BRAND_NAVY } from '@/theme/brand';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_WIDTH = SCREEN_WIDTH - Spacing[8];
const IMAGE_HEIGHT = Math.min(SCREEN_HEIGHT * 0.72, SCREEN_WIDTH);

type ImageViewerModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  zoomHint?: string;
  caption?: string;
};

export function ImageViewerModal({ visible, uri, onClose, zoomHint, caption }: ImageViewerModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const hint = zoomHint ?? t('imageViewerModal.zoomHint');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('imageViewerModal.close')} />

        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + Spacing[3], right: insets.right + Spacing[4] }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('imageViewerModal.close')}
        >
          <Ionicons name="close" size={28} color={BRAND_NAVY} />
        </TouchableOpacity>

        <View style={[styles.content, { paddingTop: insets.top + Spacing[12], paddingBottom: insets.bottom + Spacing[6] }]}>
          {uri ? (
            <ZoomableImage
              uri={uri}
              style={styles.image}
            />
          ) : null}
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          <Text style={styles.hint}>{hint}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(1, 8, 16, 0.94)',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 20,
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: BRAND_GOLD_MID,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  hint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  caption: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
    fontWeight: '700',
  },
});
