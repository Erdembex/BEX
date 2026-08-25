import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Button, Input } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles } from '@/theme';
import { useTranslation } from '@/i18n';
import { useAuthStore } from '@/store/authStore';
import { deleteAccountRequest } from '@/features/account/accountApi';
import { exportAccountDataToFile } from '@/features/account/exportAccountData';
import { clearTokens } from '@/lib/auth/tokenStorage';

export default function DeleteAccountScreen() {
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const signOut = useAuthStore((s) => s.signOut);

  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const consequences = [
    t('deleteAccount.consequenceProfile'),
    t('deleteAccount.consequenceCoupons'),
    t('deleteAccount.consequenceListings'),
    t('deleteAccount.consequenceRecords'),
    t('deleteAccount.consequenceIrreversible'),
  ];

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      await exportAccountDataToFile();
    } catch (err: any) {
      setError(err?.message || t('deleteAccount.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const runDeletion = async () => {
    setDeleting(true);
    setError('');
    try {
      await deleteAccountRequest({ password, reason });
      await clearTokens();
      signOut();
      router.replace('/(auth)/login');
      Alert.alert(t('deleteAccount.doneTitle'), t('deleteAccount.doneMessage'));
    } catch (err: any) {
      setError(err?.message || t('deleteAccount.failed'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = () => {
    if (!password) {
      setError(t('deleteAccount.passwordRequired'));
      return;
    }
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmMessage'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirmAction'), style: 'destructive', onPress: runDeletion },
    ]);
  };

  return (
    <Screen style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('deleteAccount.title')}</Text>
            <Text style={styles.subtitle}>{t('deleteAccount.subtitle')}</Text>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>{t('deleteAccount.whatHappens')}</Text>
            {consequences.map((line) => (
              <Text key={line} style={styles.warningItem}>
                {`\u2022 ${line}`}
              </Text>
            ))}
          </View>

          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>{t('deleteAccount.exportTitle')}</Text>
            <Text style={styles.exportText}>{t('deleteAccount.exportText')}</Text>
            <Button
              title={t('deleteAccount.exportAction')}
              variant="outline"
              onPress={handleExport}
              loading={exporting}
            />
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={t('deleteAccount.passwordLabel')}
              placeholder={t('deleteAccount.passwordPlaceholder')}
              hint={t('deleteAccount.passwordHint')}
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="current-password"
              textContentType="password"
            />

            <Input
              label={t('deleteAccount.reasonLabel')}
              placeholder={t('deleteAccount.reasonPlaceholder')}
              hint={t('deleteAccount.reasonHint')}
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={500}
            />

            <Button
              title={t('deleteAccount.submit')}
              variant="danger"
              onPress={handleSubmit}
              loading={deleting}
            />

            <Button
              title={t('deleteAccount.keepAccount')}
              variant="ghost"
              onPress={() => router.back()}
            />
          </View>

          <Text style={styles.legalNote}>{t('deleteAccount.legalNote')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[10],
    gap: Spacing[5],
  },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  header: { gap: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyLarge, color: Colors.textSecondary, lineHeight: 24 },
  warningCard: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  warningTitle: { ...Typography.labelLarge, color: Colors.error, fontWeight: '700' },
  warningItem: { ...Typography.bodySmall, color: Colors.textPrimary, lineHeight: 20 },
  exportCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  exportTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  exportText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  form: { gap: Spacing[4] },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorBannerText: { ...Typography.bodySmall, color: Colors.error },
  legalNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
}));
