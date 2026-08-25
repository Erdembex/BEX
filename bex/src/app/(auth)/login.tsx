import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { Typography, Spacing, Radius } from '@/theme';
import { Button, Input, PasslaLogo } from '@/components/ui';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import { useTranslation } from '@/i18n';

const GLASS_TEXT = '#F0EEE9';
const GLASS_MUTED = 'rgba(240, 238, 233, 0.72)';
const GLASS_GOLD = '#E7C663';

export default function LoginScreen() {
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
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const code = authErr?.code ?? '';
      const message = authErr?.message || getAuthErrorMessage(code);
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
      <AuthGlassBackground />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrap}>
            <PasslaLogo size="md" centered tone="onDark" />
          </View>

          <AuthGlassCard>
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
                variant="glass"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                rightIcon={<Ionicons name="mail-outline" size={20} color={GLASS_MUTED} />}
              />

              <Input
                variant="glass"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="password"
                textContentType="password"
              />

              <View style={styles.optionsRow}>
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={t('auth.login')}
                onPress={handleLogin}
                loading={loading}
                variant="gold"
              />
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>{t('auth.register')}</Text>
              </TouchableOpacity>
            </View>
          </AuthGlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#010810',
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[8],
    gap: Spacing[6],
  },
  logoWrap: {
    alignItems: 'center',
  },
  header: {
    marginBottom: Spacing[6],
    gap: Spacing[2],
  },
  title: {
    ...Typography.headingLarge,
    color: GLASS_TEXT,
    fontSize: 26,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: GLASS_MUTED,
    lineHeight: 22,
  },
  form: {
    gap: Spacing[4],
  },
  errorBanner: {
    backgroundColor: 'rgba(201, 90, 98, 0.18)',
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(201, 90, 98, 0.45)',
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: '#F5A8AD',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: -Spacing[1],
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: GLASS_GOLD,
    borderColor: GLASS_GOLD,
  },
  checkmark: {
    color: '#031528',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberText: {
    ...Typography.bodySmall,
    color: GLASS_TEXT,
  },
  forgotText: {
    ...Typography.labelMedium,
    color: GLASS_GOLD,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[6],
    flexWrap: 'wrap',
  },
  registerText: {
    ...Typography.bodyMedium,
    color: GLASS_MUTED,
  },
  registerLink: {
    ...Typography.labelLarge,
    color: GLASS_GOLD,
  },
});
