import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/common/Screen';
import { router, useLocalSearchParams } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { resolvePostLoginRoute } from '@/lib/authRouting';
import {
  loadSavedCredentials,
  saveCredentials,
  clearSavedCredentials,
} from '@/lib/credentialStorage';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { BRAND_NAVY } from '@/theme/brand';
import { Button, Input } from '@/components/ui';
import { AuthGlassBackground } from '@/components/auth/AuthGlassBackground';
import { AuthGlassCard } from '@/components/auth/AuthGlassCard';
import { useTranslation } from '@/i18n';

const GLASS_TEXT = '#F0EEE9';
const GLASS_MUTED = 'rgba(240, 238, 233, 0.72)';
const GLASS_GOLD = '#E7C663';

export default function LoginScreen() {
  const Colors = useThemeColors();
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
    <Screen style={[styles.safe, { backgroundColor: Colors.background }]}>
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
          <Ionicons name="chevron-back" size={24} color={GLASS_TEXT} />
        </TouchableOpacity>
      ) : null}

      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <Pressable
          style={styles.dismissArea}
          onPress={Keyboard.dismiss}
          accessibilityRole="button"
          accessibilityLabel={t('auth.dismissKeyboard')}
        />

        <View
          style={[
            styles.formDock,
            {
              paddingBottom: Math.max(insets.bottom, Spacing[3]),
            },
          ]}
        >
          <AuthGlassCard style={styles.formCard} compact={keyboardVisible}>
            {!keyboardVisible ? (
              <View style={styles.header}>
                <Text style={styles.title}>{t('auth.loginTitle')}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>
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
                variant="glass"
                compact={keyboardVisible}
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                rightIcon={<Ionicons name="mail-outline" size={20} color={GLASS_MUTED} />}
              />

              <Input
                variant="glass"
                compact={keyboardVisible}
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
                size="md"
              />
            </View>

            {!keyboardVisible ? (
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>{t('auth.noAccount')}</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                  <Text style={styles.registerLink}>{t('auth.register')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </AuthGlassCard>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: 'flex-end',
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
  dismissArea: {
    flex: 1,
  },
  formDock: {
    paddingHorizontal: Spacing[4],
  },
  formCard: {
    alignSelf: 'stretch',
  },
  header: {
    marginBottom: Spacing[3],
    gap: Spacing[1],
  },
  title: {
    ...Typography.headingLarge,
    color: GLASS_TEXT,
    fontSize: 24,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: GLASS_MUTED,
    lineHeight: 20,
  },
  form: {
    gap: Spacing[2],
  },
  errorBanner: {
    backgroundColor: 'rgba(201, 90, 98, 0.12)',
    borderRadius: Radius.md,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(201, 90, 98, 0.35)',
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
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: GLASS_GOLD,
    borderColor: GLASS_GOLD,
  },
  checkmark: {
    color: BRAND_NAVY,
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
    marginTop: Spacing[4],
    flexWrap: 'wrap',
    gap: Spacing[1],
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
