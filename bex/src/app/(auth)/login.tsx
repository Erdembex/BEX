import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import {
  loadSavedCredentials,
  saveCredentials,
  clearSavedCredentials,
} from '@/lib/credentialStorage';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button, Input, PasslaLogo } from '@/components/ui';
import { useTranslation } from '@/i18n';

export default function LoginScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { setBexUser, setFirebaseUser } = useAuthStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSavedCredentials().then((saved) => {
      if (saved) {
        setEmail(saved.email);
        setPassword(saved.password);
        setRememberMe(saved.remember);
      }
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.emailPasswordRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const trimmedEmail = email.trim();
      const { user } = await authService.login(trimmedEmail, password);
      const profile = await authService.getUserDocument(user.uid, {
        email: user.email,
        displayName: user.displayName,
      });
      setFirebaseUser(user);
      setBexUser(profile);

      if (rememberMe) {
        await saveCredentials(trimmedEmail, password);
      } else {
        await clearSavedCredentials();
      }

      router.replace(AUTH_HOME_ROUTE);
    } catch (err: any) {
      const code: string = err?.code ?? '';
      const message = err?.message || getAuthErrorMessage(code);
      console.error('[LoginScreen] Giriş hatası:', code, message);

      if (code === 'auth/email-not-verified') {
        router.push({
          pathname: '/(auth)/email-verification',
          params: { email: email.trim() },
        });
        return;
      }

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
          <View style={styles.logoContainer}>
            <PasslaLogo size="md" centered />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.loginTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label={t('auth.email')}
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            <Input
              label={t('auth.password')}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
              textContentType="password"
            />

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotLink}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <Button title={t('auth.login')} onPress={handleLogin} loading={loading} />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
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
    paddingTop: Spacing[8],
    paddingBottom: Spacing[8],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing[8],
  },
  header: {
    marginBottom: Spacing[8],
    gap: Spacing[2],
  },
  title: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: Colors.textSecondary,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginTop: -Spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rememberText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -Spacing[2],
  },
  forgotText: {
    ...Typography.labelMedium,
    color: Colors.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[6],
    gap: Spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  registerLink: {
    ...Typography.labelLarge,
    color: Colors.primary,
  },
}));
