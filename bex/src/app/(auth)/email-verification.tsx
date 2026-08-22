import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { clearTokens } from '@/lib/auth/tokenStorage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';

const CODE_LENGTH = 8;

export default function EmailVerificationScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string; devCode?: string }>();
  const email = (params.email ?? '').toString();
  const { setBexUser, setFirebaseUser, signOut } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(
    __DEV__ && params.devCode ? params.devCode.toString().toUpperCase() : null
  );

  const codeRef = useRef<TextInput | null>(null);

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

  useEffect(() => {
    const timer = setTimeout(() => codeRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

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
            <Text style={styles.backText}>{t('emailVerificationScreen.back')}</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Text style={styles.icon}>✉️</Text>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t('emailVerificationScreen.title')}</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.emailHighlight}>{email}</Text>
              {t('emailVerificationScreen.subtitleSuffix')}
            </Text>
          </View>

          {__DEV__ && devCode ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                {t('emailVerificationScreen.devCode', { code: devCode })}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>{t('emailVerificationScreen.codeLabel')}</Text>
            <TextInput
              ref={codeRef}
              style={styles.codeInput}
              placeholder="AB12CD34"
              placeholderTextColor={Colors.textTertiary}
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
            />

            <Button
              title={t('emailVerificationScreen.verify')}
              onPress={handleVerify}
              loading={loading}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>{t('emailVerificationScreen.resendPrompt')}</Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>{resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendLink}>{t('emailVerificationScreen.resend')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Button
              title={t('emailVerificationScreen.backToLogin')}
              onPress={() => router.replace('/(auth)/login')}
              variant="ghost"
            />
          </View>
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
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  iconContainer: { alignItems: 'center', marginTop: Spacing[4] },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 48 },
  header: { gap: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyLarge, color: Colors.textSecondary, lineHeight: 24 },
  emailHighlight: { color: Colors.textPrimary, fontWeight: '600' },
  hintBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  hintText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  form: { gap: Spacing[5] },
  inputLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  codeInput: {
    minHeight: 58,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.textPrimary,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
  },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { ...Typography.bodySmall, color: Colors.textSecondary },
  resendLink: { ...Typography.labelMedium, color: Colors.primary },
  resendTimer: { ...Typography.labelMedium, color: Colors.textTertiary },
}));
