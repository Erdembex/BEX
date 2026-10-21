import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius, FontFamily } from '@/theme';
import { Input } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { maskEmail } from '@/lib/maskEmail';
import { androidTextLayout } from '@/lib/androidUi';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');

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
      bare
      scrollBody
      center
      onBack={() => router.back()}
      backLabel={t('forgotPasswordScreen.back')}
    >
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />
      {step === 'form' ? (
        <>
          <Text style={styles.title}>{t('forgotPasswordScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('forgotPasswordScreen.subtitle')}</Text>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>{t('forgotPasswordScreen.emailLabel')}</Text>
            <Input
              variant="frost"
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.submitLabel}>
                {loading ? '...' : t('forgotPasswordScreen.submit')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t('forgotPasswordScreen.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{t('forgotPasswordScreen.successTitle')}</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.emailMark}>{maskEmail(email)}</Text>
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

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() =>
              router.push(
                devResetToken
                  ? `/(auth)/reset-password?token=${devResetToken}`
                  : '/(auth)/reset-password'
              )
            }
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Text style={styles.submitLabel}>{t('forgotPasswordScreen.enterCode')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('forgotPasswordScreen.backToLoginFull')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('form')} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('forgotPasswordScreen.resend')}</Text>
          </TouchableOpacity>
        </>
      )}
    </AuthBrandedScreen>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 124,
    height: 72,
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    color: CREAM,
    textAlign: 'center',
    marginBottom: 10,
    ...androidTextLayout,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(240,238,233,0.72)',
    textAlign: 'center',
    marginBottom: 28,
    ...androidTextLayout,
  },
  emailMark: {
    fontFamily: FontFamily.bold,
    color: CREAM,
  },
  form: { gap: Spacing[3] },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(240,238,233,0.78)',
    marginLeft: 8,
    marginBottom: 8,
  },
  errorBanner: {
    backgroundColor: AUTH_SHEET.errorBg,
    borderRadius: Radius.xl,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.28)',
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: '#F0B4B4',
  },
  submitBtn: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: {
    fontFamily: FontFamily.bold,
    color: NAVY,
    fontSize: 17,
    textAlign: 'center',
  },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
  },
  devCodeBox: {
    backgroundColor: 'rgba(240,238,233,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(240,238,233,0.2)',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  devCodeLabel: {
    ...Typography.labelMedium,
    color: CREAM,
    fontWeight: '700',
    textAlign: 'center',
  },
  devCodeValue: {
    ...Typography.headingMedium,
    color: CREAM,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '800',
  },
  devCodeHint: {
    ...Typography.bodySmall,
    color: 'rgba(240,238,233,0.72)',
    lineHeight: 20,
    textAlign: 'center',
  },
});
