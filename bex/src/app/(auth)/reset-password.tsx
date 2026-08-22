import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/i18n';

type Step = 'form' | 'success';

export default function ResetPasswordScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState((params.token ?? '').toString().toUpperCase());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');

  const handleSubmit = async () => {
    const normalizedToken = token.trim().toUpperCase();
    if (normalizedToken.length < 8) {
      setError(t('resetPasswordScreen.errorCodeLength'));
      return;
    }
    if (password.length < 8) {
      setError(t('resetPasswordScreen.errorPasswordLength'));
      return;
    }
    if (!/(?=.*[0-9])(?=.*[A-Z])/.test(password)) {
      setError(t('resetPasswordScreen.errorPasswordComplexity'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('resetPasswordScreen.errorPasswordMismatch'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.completePasswordReset(normalizedToken, password);
      setStep('success');
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const message =
        (err as Error)?.message || getAuthErrorMessage(code) || t('resetPasswordScreen.errorGeneric');
      setError(message);
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.backText}>{t('resetPasswordScreen.back')}</Text>
          </TouchableOpacity>

          {step === 'form' ? (
            <>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔐</Text>
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>{t('resetPasswordScreen.title')}</Text>
                <Text style={styles.subtitle}>
                  {t('resetPasswordScreen.subtitle')}
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label={t('resetPasswordScreen.codeLabel')}
                  placeholder="AB12CD34"
                  value={token}
                  onChangeText={(value) => setToken(value.toUpperCase())}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <Input
                  label={t('resetPasswordScreen.newPasswordLabel')}
                  placeholder={t('resetPasswordScreen.newPasswordPlaceholder')}
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  hint={t('resetPasswordScreen.newPasswordHint')}
                />

                <Input
                  label={t('resetPasswordScreen.confirmPasswordLabel')}
                  placeholder={t('resetPasswordScreen.confirmPasswordPlaceholder')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />

                <Button title={t('resetPasswordScreen.submit')} onPress={handleSubmit} loading={loading} />

                <Button
                  title={t('resetPasswordScreen.resendCode')}
                  onPress={() => router.replace('/(auth)/forgot-password')}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✅</Text>
              </View>

              <Text style={styles.successTitle}>{t('resetPasswordScreen.successTitle')}</Text>
              <Text style={styles.successText}>
                {t('resetPasswordScreen.successText')}
              </Text>

              <Button
                title={t('resetPasswordScreen.goToLogin')}
                onPress={() => router.replace('/(auth)/login')}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing[8],
  },
  icon: {
    fontSize: 64,
  },
  header: {
    gap: Spacing[2],
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    gap: Spacing[5],
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: Colors.error,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing[16],
    gap: Spacing[5],
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
}));
