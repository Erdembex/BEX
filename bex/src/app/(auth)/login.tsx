import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  useWindowDimensions,
  type KeyboardEvent,
} from 'react-native';
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
import { androidTextLayout } from '@/lib/androidUi';
import { useResolvedSafeAreaInsets } from '@/components/common/Screen';
import { Typography, Spacing, Radius } from '@/theme';
import { Input } from '@/components/ui';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthFrostCard } from '@/components/auth/AuthFrostCard';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { useTranslation } from '@/i18n';

export default function LoginScreen() {
  const insets = useResolvedSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Kart, duvardaki PASSLA'nın altına otursun; yazının üstünü kapatmasın.
  const logoClearance = Math.round(height * 0.24);
  const { setBexUser, setFirebaseUser } = useAuthStore();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const restingHeight = useRef(height);

  useEffect(() => {
    if (!keyboardOpen) restingHeight.current = height;
  }, [height, keyboardOpen]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (event: KeyboardEvent) => {
      setKeyboardOpen(true);
      if (Platform.OS !== 'android') {
        setKeyboardInset(0);
        return;
      }
      const windowHeight = Dimensions.get('window').height;
      const fromTop = windowHeight - event.endCoordinates.screenY;
      const reported =
        fromTop > 0 && fromTop < windowHeight ? fromTop : event.endCoordinates.height;
      const alreadyResized = Math.max(0, restingHeight.current - windowHeight);
      setKeyboardInset(Math.max(0, reported - alreadyResized));
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      setKeyboardInset(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    Keyboard.dismiss();

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

      <KeyboardAvoidingView
        style={[styles.flex, keyboardInset > 0 && { marginBottom: keyboardInset }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            keyboardOpen && styles.scrollKeyboard,
            {
              paddingTop: keyboardOpen ? Spacing[2] : insets.top + Spacing[2],
              paddingBottom: keyboardOpen ? Spacing[2] : Math.max(insets.bottom, Spacing[3]),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {keyboardOpen ? null : <View style={{ height: logoClearance }} />}

          <AuthFrostCard compact style={styles.card}>
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
                variant="frost"
                compact
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                rightIcon={<Ionicons name="mail-outline" size={20} color={AUTH_SHEET.muted} />}
              />

              <Input
                variant="frost"
                compact
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
                    {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                  </View>
                  <Text style={styles.rememberText} numberOfLines={1}>
                    {t('auth.rememberMe')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.forgotHit}
                >
                  <Text style={styles.forgotText} numberOfLines={2}>
                    {t('auth.forgotPassword')}
                  </Text>
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
    minHeight: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing[6],
  },
  scrollKeyboard: {
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  header: {
    marginBottom: Spacing[1],
    gap: 2,
  },
  title: {
    ...Typography.headingMedium,
    color: AUTH_SHEET.ink,
    fontSize: 22,
    lineHeight: 28,
    ...androidTextLayout,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: AUTH_SHEET.body,
    lineHeight: 18,
    fontSize: 13,
    ...androidTextLayout,
  },
  form: {
    gap: Spacing[2],
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
    color: AUTH_SHEET.error,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
    minWidth: 0,
  },
  forgotHit: {
    flexShrink: 1,
    maxWidth: '46%',
    alignItems: 'flex-end',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: AUTH_SHEET.ink,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: AUTH_SHEET.ink,
    borderColor: AUTH_SHEET.ink,
  },
  rememberText: {
    ...Typography.bodySmall,
    color: AUTH_SHEET.body,
    flexShrink: 1,
    ...androidTextLayout,
  },
  forgotText: {
    ...Typography.labelMedium,
    color: AUTH_SHEET.ink,
    textAlign: 'right',
    ...androidTextLayout,
  },
  loginBtn: {
    minHeight: 46,
    borderRadius: Radius.full,
    backgroundColor: AUTH_SHEET.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    marginTop: Spacing[1],
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginLabel: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[3],
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  registerText: {
    ...Typography.bodyMedium,
    color: AUTH_SHEET.muted,
    fontSize: 14,
  },
  registerLink: {
    ...Typography.labelLarge,
    color: AUTH_SHEET.ink,
    fontSize: 15,
    fontWeight: '700',
  },
});
