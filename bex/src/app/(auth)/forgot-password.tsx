import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { Typography, Spacing, Radius } from '@/theme';
import { Button, Input } from '@/components/ui';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthFrostCard } from '@/components/auth/AuthFrostCard';
import { useTranslation } from '@/i18n';

const INK = '#17264F';
const BODY = '#1E293B';
const MUTED = '#64708C';

type Step = 'form' | 'success';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
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
    <AuthGlassBackground>
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + Spacing[2] }]}
        onPress={() => router.back()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: Math.max(insets.bottom, Spacing[4]) + Spacing[6] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSpacer} />

          <AuthFrostCard style={styles.card}>
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
                    rightIcon={<Ionicons name="mail-outline" size={20} color={MUTED} />}
                  />

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleReset}
                    disabled={loading}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.primaryBtnText}>{t('forgotPasswordScreen.submit')}</Text>
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
          </AuthFrostCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthGlassBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backBtn: {
    position: 'absolute',
    left: Spacing[4],
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[5],
  },
  heroSpacer: { minHeight: 120 },
  card: { width: '100%' },
  header: { alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[4] },
  emoji: { fontSize: 48 },
  title: {
    ...Typography.headingMedium,
    color: INK,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: BODY,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.92,
  },
  form: { gap: Spacing[4] },
  errorBanner: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: '#B91C1C',
    lineHeight: 20,
  },
  primaryBtn: {
    backgroundColor: INK,
    borderRadius: Radius.lg,
    paddingVertical: Spacing[4],
    alignItems: 'center',
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
    color: INK,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successBlock: { gap: Spacing[4], alignItems: 'stretch' },
  emailHighlight: { fontWeight: '700', color: INK },
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
    color: INK,
    fontWeight: '700',
  },
  devCodeValue: {
    ...Typography.headingMedium,
    color: INK,
    letterSpacing: 2,
    textAlign: 'center',
    fontWeight: '800',
  },
  devCodeHint: {
    ...Typography.bodySmall,
    color: MUTED,
    lineHeight: 20,
    textAlign: 'center',
  },
});
