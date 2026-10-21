import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { clearTokens } from '@/lib/auth/tokenStorage';
import { Typography, Spacing, Radius, FontFamily } from '@/theme';
import { Input } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { maskEmail } from '@/lib/maskEmail';
import { androidTextLayout } from '@/lib/androidUi';

const CODE_LENGTH = 8;
const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');

export default function EmailVerificationScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string; devCode?: string }>();
  const email = (params.email ?? '').toString();
  const maskedEmail = email ? maskEmail(email) : '';
  const { setBexUser, setFirebaseUser, signOut } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(
    __DEV__ && params.devCode ? params.devCode.toString().toUpperCase() : null
  );

  useEffect(() => {
    void clearTokens();
    signOut();
  }, [signOut]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length < CODE_LENGTH) {
      setError(t('emailVerificationScreen.errorCodeLength'));
      return;
    }
    if (!email) {
      setError(t('emailVerificationScreen.errorEmailMissing'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user } = await authService.verifyEmail(email, normalized);
      const profile = await authService.getUserDocument(user.uid, {
        email: user.email ?? email,
        displayName: user.displayName,
      });
      setFirebaseUser(user);
      setBexUser(profile);
      router.replace(AUTH_HOME_ROUTE);
    } catch (err: unknown) {
      const codeKey = (err as { code?: string })?.code ?? '';
      const message =
        (err as Error)?.message ||
        getAuthErrorMessage(codeKey) ||
        t('emailVerificationScreen.errorGeneric');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendTimer > 0) return;

    setLoading(true);
    setError('');

    try {
      const result = await authService.resendVerificationEmail(email);
      if (result.devVerificationCode && __DEV__) {
        setDevCode(result.devVerificationCode.toUpperCase());
      }
      setCode('');
      setResendTimer(60);
    } catch (err: unknown) {
      const codeKey = (err as { code?: string })?.code ?? '';
      const message =
        (err as Error)?.message ||
        getAuthErrorMessage(codeKey) ||
        t('emailVerificationScreen.errorResend');
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
      backLabel={t('emailVerificationScreen.back')}
    >
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text style={styles.title}>{t('emailVerificationScreen.title')}</Text>
      <Text style={styles.subtitle}>
        {maskedEmail ? <Text style={styles.emailMark}>{maskedEmail}</Text> : null}
        {t('emailVerificationScreen.subtitleSuffix')}
      </Text>

      {__DEV__ && devCode ? (
        <Text style={styles.devNote}>{t('emailVerificationScreen.devCode', { code: devCode })}</Text>
      ) : null}

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>{t('emailVerificationScreen.codeLabel')}</Text>
        <Input
          variant="frost"
          placeholder="AB12CD34"
          value={code}
          onChangeText={(value) => {
            setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH));
            setError('');
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          maxLength={CODE_LENGTH}
          autoFocus
          style={styles.codeInput}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          <Text style={styles.submitLabel}>
            {loading ? '...' : t('emailVerificationScreen.verify')}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>{t('emailVerificationScreen.resendPrompt')}</Text>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>{resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={loading}>
              <Text style={styles.resendLink}>{t('emailVerificationScreen.resend')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.linkBtn}>
          <Text style={styles.linkText}>{t('emailVerificationScreen.backToLogin')}</Text>
        </TouchableOpacity>
      </View>
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
  devNote: {
    ...Typography.bodySmall,
    color: 'rgba(240,238,233,0.72)',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 20,
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
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    color: 'rgba(240,238,233,0.72)',
  },
  resendLink: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: CREAM,
  },
  resendTimer: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: 'rgba(240,238,233,0.72)',
  },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkText: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
  },
});
