import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius, FontFamily } from '@/theme';
import { Input } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { androidTextLayout } from '@/lib/androidUi';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');

type Step = 'form' | 'success';

export default function ResetPasswordScreen() {
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
    <AuthBrandedScreen
      bare
      scrollBody
      center
      onBack={() => router.back()}
      backLabel={t('resetPasswordScreen.back')}
    >
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />

      {step === 'form' ? (
        <>
          <Text style={styles.title}>{t('resetPasswordScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('resetPasswordScreen.subtitle')}</Text>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>{t('resetPasswordScreen.codeLabel')}</Text>
            <Input
              variant="frost"
              placeholder="AB12CD34"
              value={token}
              onChangeText={(value) => setToken(value.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.codeInput}
            />

            <Text style={styles.sectionLabel}>{t('resetPasswordScreen.newPasswordLabel')}</Text>
            <Input
              variant="frost"
              placeholder={t('resetPasswordScreen.newPasswordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              isPassword
            />
            <Text style={styles.hint}>{t('resetPasswordScreen.newPasswordHint')}</Text>

            <Text style={styles.sectionLabel}>{t('resetPasswordScreen.confirmPasswordLabel')}</Text>
            <Input
              variant="frost"
              placeholder={t('resetPasswordScreen.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
            />

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.submitLabel}>
                {loading ? '...' : t('resetPasswordScreen.submit')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(auth)/forgot-password')}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>{t('resetPasswordScreen.resendCode')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{t('resetPasswordScreen.successTitle')}</Text>
          <Text style={styles.subtitle}>{t('resetPasswordScreen.successText')}</Text>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => router.replace('/(auth)/login')}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            <Text style={styles.submitLabel}>{t('resetPasswordScreen.goToLogin')}</Text>
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
  form: { gap: Spacing[3] },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(240,238,233,0.78)',
    marginLeft: 8,
    marginBottom: 8,
  },
  codeInput: {
    textAlign: 'center',
    letterSpacing: 4,
    fontFamily: FontFamily.bold,
    fontSize: 18,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: 'rgba(240,238,233,0.55)',
    marginLeft: 8,
    marginTop: -4,
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
  },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
    textAlign: 'center',
  },
});
