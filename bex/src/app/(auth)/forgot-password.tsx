import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/i18n';

type Step = 'form' | 'success';

export default function ForgotPasswordScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError(t('forgotPasswordScreen.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.resetPassword(email.trim());
      setDevResetToken(result.devResetToken ?? null);
      setStep('success');
    } catch (err: any) {
      const code = err?.code ?? '';
      const message = err?.message || getAuthErrorMessage(code);
      if (code === 'auth/not-supported-yet') {
        setError(message);
      } else if (code === 'auth/user-not-found') {
        setError(t('forgotPasswordScreen.userNotFound'));
      } else {
        setError(t('forgotPasswordScreen.genericError'));
      }
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
          {/* Geri */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('forgotPasswordScreen.back')}</Text>
          </TouchableOpacity>

          {step === 'form' ? (
            <>
              {/* Başlık */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>🔑</Text>
              </View>

              <View style={styles.header}>
                <Text style={styles.title}>{t('forgotPasswordScreen.title')}</Text>
                <Text style={styles.subtitle}>
                  {t('forgotPasswordScreen.subtitle')}
                </Text>
              </View>

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label={t('forgotPasswordScreen.emailLabel')}
                  placeholder={t('forgotPasswordScreen.emailPlaceholder')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />

                <Button
                  title={t('forgotPasswordScreen.submit')}
                  onPress={handleReset}
                  loading={loading}
                />

                <Button
                  title={t('forgotPasswordScreen.backToLogin')}
                  onPress={() => router.back()}
                  variant="ghost"
                />
              </View>
            </>
          ) : (
            /* Başarı durumu */
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successEmoji}>✉️</Text>
              </View>

              <Text style={styles.successTitle}>{t('forgotPasswordScreen.successTitle')}</Text>
              <Text style={styles.successText}>
                <Text style={styles.emailHighlight}>{email}</Text>
                {t('forgotPasswordScreen.successText')}
              </Text>

              {devResetToken ? (
                <View style={styles.devCodeBox}>
                  <Text style={styles.devCodeLabel}>{t('forgotPasswordScreen.devTokenLabel')}</Text>
                  <Text style={styles.devCodeValue} selectable>
                    {devResetToken}
                  </Text>
                  <Text style={styles.devCodeHint}>
                    {t('forgotPasswordScreen.devTokenHint')}
                  </Text>
                </View>
              ) : __DEV__ ? (
                <View style={styles.devCodeBox}>
                  <Text style={styles.devCodeHint}>
                    {t('forgotPasswordScreen.devNoTokenHint')}
                  </Text>
                </View>
              ) : null}

              <View style={styles.successActions}>
                <Button
                  title={t('forgotPasswordScreen.enterCode')}
                  onPress={() =>
                    router.push(
                      devResetToken
                        ? `/(auth)/reset-password?token=${devResetToken}`
                        : '/(auth)/reset-password'
                    )
                  }
                />
                <Button
                  title={t('forgotPasswordScreen.backToLoginFull')}
                  onPress={() => router.replace('/(auth)/login')}
                  variant="outline"
                />
                <Button
                  title={t('forgotPasswordScreen.resend')}
                  onPress={() => setStep('form')}
                  variant="ghost"
                />
              </View>
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

  // Başarı durumu
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
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  successActions: {
    width: '100%',
    gap: Spacing[3],
    marginTop: Spacing[4],
  },
  devCodeBox: {
    width: '100%',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing[2],
  },
  devCodeLabel: {
    ...Typography.labelMedium,
    color: Colors.primary,
    fontWeight: '700',
  },
  devCodeValue: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: '800',
  },
  devCodeHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
}));
