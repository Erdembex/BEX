import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius } from '@/theme';
import { Button, Input } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';

type Step = 'form' | 'success';

export default function ForgotPasswordScreen() {
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
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      const message = (err as Error)?.message || getAuthErrorMessage(code);
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
    <AuthBrandedScreen
      scrollSheet
      heroMinRatio={0.34}
      onBack={() => router.back()}
      backLabel={t('common.back')}
    >
      {step === 'form' ? (
        <>
          <View style={styles.header}>
            <Text style={styles.emoji}>🔑</Text>
            <Text style={styles.title}>{t('forgotPasswordScreen.title')}</Text>
            <Text style={styles.subtitle}>{t('forgotPasswordScreen.subtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              variant="frost"
              label={t('forgotPasswordScreen.emailLabel')}
              placeholder={t('forgotPasswordScreen.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              rightIcon={<Ionicons name="mail-outline" size={20} color={AUTH_SHEET.muted} />}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? '...' : t('forgotPasswordScreen.submit')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t('forgotPasswordScreen.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.successBlock}>
          <Text style={styles.emoji}>✉️</Text>
          <Text style={styles.title}>{t('forgotPasswordScreen.successTitle')}</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.emailHighlight}>{email}</Text>
            {t('forgotPasswordScreen.successText')}
          </Text>

          {devResetToken ? (
            <View style={styles.devCodeBox}>
              <Text style={styles.devCodeLabel}>{t('forgotPasswordScreen.devTokenLabel')}</Text>
              <Text style={styles.devCodeValue} selectable>
                {devResetToken}
              </Text>
              <Text style={styles.devCodeHint}>{t('forgotPasswordScreen.devTokenHint')}</Text>
            </View>
          ) : null}

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
      )}
    </AuthBrandedScreen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[4] },
  emoji: { fontSize: 48 },
  title: {
    ...Typography.headingMedium,
    color: AUTH_SHEET.ink,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: AUTH_SHEET.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  form: { gap: Spacing[4] },
  errorBanner: {
    backgroundColor: AUTH_SHEET.errorBg,
    borderRadius: Radius.xl,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.28)',
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: AUTH_SHEET.error,
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: AUTH_SHEET.ink,
    borderRadius: Radius.full,
    minHeight: 52,
    paddingVertical: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  linkBtn: { alignItems: 'center', paddingVertical: Spacing[2] },
  linkText: {
    ...Typography.labelMedium,
    color: AUTH_SHEET.ink,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successBlock: { gap: Spacing[4], alignItems: 'stretch' },
  emailHighlight: { fontWeight: '700', color: AUTH_SHEET.ink },
  devCodeBox: {
    backgroundColor: 'rgba(23, 38, 79, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(23, 38, 79, 0.2)',
    gap: Spacing[2],
  },
  devCodeLabel: {
    ...Typography.labelMedium,
    color: AUTH_SHEET.ink,
    fontWeight: '700',
  },
  devCodeValue: {
    ...Typography.headingMedium,
    color: AUTH_SHEET.ink,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '800',
  },
  devCodeHint: {
    ...Typography.bodySmall,
    color: AUTH_SHEET.muted,
    lineHeight: 20,
    textAlign: 'center',
  },
});
