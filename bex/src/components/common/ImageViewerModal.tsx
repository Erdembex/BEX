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
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ImageViewerModalProps = {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  zoomHint?: string;
  caption?: string;
};

export function ImageViewerModal({ visible, uri, onClose, zoomHint, caption }: ImageViewerModalProps) {
  const Colors = useThemeColors();
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
      <View style={[styles.backdrop, { backgroundColor: Colors.overlay ?? 'rgba(0,0,0,0.92)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t('imageViewerModal.close')} />

        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + Spacing[3], right: insets.right + Spacing[4] }]}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('imageViewerModal.close')}
        >
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.content} pointerEvents="box-none">
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
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[16],
  },
  image: {
    width: SCREEN_WIDTH - Spacing[8],
    height: Math.min(SCREEN_HEIGHT * 0.72, SCREEN_WIDTH),
    borderRadius: Radius.lg,
  },
  hint: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: Spacing[4],
  },
  caption: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
});
