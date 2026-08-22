import React, { useCallback, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

interface CouponQrScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export function CouponQrScanner({ visible, onClose, onScan }: CouponQrScannerProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    scannedRef.current = false;
    setError('');
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBarcode = ({ data }: { data: string }) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    onScan(data);
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <Screen style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('couponQrScanner.title')}</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.close}>{t('couponQrScanner.close')}</Text>
          </TouchableOpacity>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <Text style={styles.message}>{t('couponQrScanner.checkingPermission')}</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.center}>
            <Text style={styles.message}>
              {t('couponQrScanner.permissionNeeded')}
            </Text>
            <Button
              title={t('couponQrScanner.grantPermission')}
              onPress={async () => {
                const result = await requestPermission();
                if (!result.granted) {
                  setError(t('couponQrScanner.permissionDenied'));
                }
              }}
              style={{ marginTop: Spacing[4], width: 240 }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={handleBarcode}
            />
            <View style={styles.frame} pointerEvents="none" />
            <Text style={styles.hint}>{t('couponQrScanner.scanHint')}</Text>
          </View>
        )}
      </Screen>
    </Modal>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  close: { ...Typography.labelLarge, color: Colors.primary },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  error: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginTop: Spacing[3],
    textAlign: 'center',
  },
  cameraWrap: { flex: 1, position: 'relative' },
  camera: { flex: 1 },
  frame: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: '70%',
    height: '35%',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    backgroundColor: 'transparent',
  },
  hint: {
    position: 'absolute',
    bottom: Spacing[10],
    left: 0,
    right: 0,
    textAlign: 'center',
    ...Typography.bodySmall,
    color: Colors.textInverse,
    backgroundColor: Colors.overlay,
    paddingVertical: Spacing[3],
  },
}));
