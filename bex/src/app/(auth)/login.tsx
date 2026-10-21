import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
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
import { Typography, Spacing, Radius, FontFamily } from '@/theme';
import { Input } from '@/components/ui';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { useTranslation } from '@/i18n';
import { useKeyboardOverlap } from '@/components/auth/useKeyboardOverlap';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');

export default function LoginScreen() {
  const insets = useResolvedSafeAreaInsets();
  const { setBexUser, setFirebaseUser } = useAuthStore();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { open: keyboardOpen, overlap: keyboardOverlap } = useKeyboardOverlap();

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

      <KeyboardAvoidingView
        style={[styles.flex, keyboardOverlap > 0 ? { paddingBottom: keyboardOverlap } : null]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            keyboardOpen ? styles.scrollOpen : styles.scrollRest,
            {
              paddingTop: insets.top + 18,
              paddingBottom: Math.max(insets.bottom, Spacing[4]),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={false}
        >
          <Image
            source={SS_MARK}
            style={[styles.mark, keyboardOpen && styles.markCompact]}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />

          <Text style={styles.title}>{t('auth.loginTitle')}</Text>

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              variant="frost"
              compact
              placeholder={t('auth.email')}
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
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              isPassword
              autoComplete="password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.forgotHit}
            >
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe ? <Ionicons name="checkmark" size={14} color={NAVY} /> : null}
              </View>
              <Text style={styles.rememberText}>{t('auth.rememberMe')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.loginLabel}>{loading ? '...' : t('auth.loginTitle')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY,
  },
  flex: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  scrollRest: {
    justifyContent: 'center',
  },
  scrollOpen: {
    flexGrow: 0,
    justifyContent: 'flex-start',
  },
  mark: {
    width: 156,
    height: 92,
    alignSelf: 'center',
    marginBottom: 36,
  },
  markCompact: {
    width: 72,
    height: 42,
    marginTop: 0,
    marginBottom: 12,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.1,
    color: CREAM,
    marginBottom: 32,
    ...androidTextLayout,
  },
  form: {
    gap: Spacing[3],
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  forgotHit: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    marginTop: -4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: CREAM,
    borderColor: CREAM,
  },
  rememberText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: 'rgba(240,238,233,0.78)',
    ...androidTextLayout,
  },
  forgotText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: CREAM,
    ...androidTextLayout,
  },
  loginBtn: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginLabel: {
    fontFamily: FontFamily.bold,
    color: NAVY,
    fontSize: 17,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing[1],
    marginTop: 36,
  },
  registerText: {
    fontFamily: FontFamily.regular,
    color: 'rgba(240,238,233,0.72)',
    fontSize: 15,
  },
  registerLink: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
  },
});
