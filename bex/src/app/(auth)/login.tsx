import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { resolvePostLoginRoute } from '@/lib/authRouting';
import {
  loadSavedCredentials,
  saveCredentials,
  clearSavedCredentials,
} from '@/lib/credentialStorage';
import { Typography, Spacing, Radius } from '@/theme';
import { Input } from '@/components/ui';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthFrostCard } from '@/components/auth/AuthFrostCard';
import { useTranslation } from '@/i18n';

const INK = '#17264F';
const BODY = '#1E293B';
const MUTED = '#64708C';
const LINE = '#64708C';

export default function LoginScreen() {
  const windowHeight = Dimensions.get('window').height;
  const insets = useSafeAreaInsets();
  const { setBexUser, setFirebaseUser } = useAuthStore();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    loadSavedCredentials().then((saved) => {
      if (saved) {
        setEmail(saved.email);
        setPassword(saved.password);
        setRememberMe(saved.remember);
      }
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
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

      router.replace(resolvePostLoginRoute(returnTo));
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
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuthGlassBackground />

      {router.canGoBack() ? (
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + Spacing[2] }]}
          onPress={() => {
            Keyboard.dismiss();
            router.back();
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: keyboardVisible ? insets.top + Spacing[2] : 0,
              paddingBottom: Math.max(insets.bottom, Spacing[4]) + Spacing[4],
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {!keyboardVisible ? (
            <View style={{ minHeight: Math.max(windowHeight * 0.34, 220) }} />
          ) : null}

          <AuthFrostCard style={styles.card} compact={keyboardVisible}>
            {!keyboardVisible ? (
              <View style={styles.header}>
                <Text style={styles.title}>{t('auth.loginTitle')}</Text>
                <Text
                  style={styles.subtitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {t('auth.loginSubtitle')}
                </Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              <Input
                variant="frost"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                rightIcon={<Ionicons name="mail-outline" size={20} color={MUTED} />}
              />

              <Input
                variant="frost"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRememberMe((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
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

              <TouchableOpacity
                style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                accessibilityRole="button"
              >
                <Text style={styles.loginLabel}>
                  {loading ? '...' : `${t('auth.login')}  →`}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.registerLink}>{t('auth.register')}</Text>
              </TouchableOpacity>
            </View>
          </AuthFrostCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#17264F',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing[4],
  },
  backBtn: {
    position: 'absolute',
    left: Spacing[4],
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    alignSelf: 'stretch',
  },
  header: {
    marginBottom: Spacing[4],
    gap: Spacing[1],
  },
  title: {
    ...Typography.headingLarge,
    color: INK,
    fontSize: 26,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: MUTED,
    lineHeight: 20,
  },
  form: {
    gap: Spacing[3],
  },
  errorBanner: {
    backgroundColor: 'rgba(185, 28, 28, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(185, 28, 28, 0.28)',
  },
  errorBannerText: {
    ...Typography.bodySmall,
    color: '#B91C1C',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: LINE,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: INK,
    borderColor: INK,
  },
  rememberText: {
    ...Typography.bodySmall,
    color: BODY,
  },
  forgotText: {
    ...Typography.labelMedium,
    color: INK,
  },
  loginBtn: {
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[1],
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginLabel: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontSize: 17,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  registerText: {
    ...Typography.bodyMedium,
    color: MUTED,
  },
  registerLink: {
    ...Typography.labelLarge,
    color: INK,
  },
});
