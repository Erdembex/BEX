import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router } from 'expo-router';
import { AUTH_HOME_ROUTE } from '@/lib/authRouting';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { authService } from '@/features/auth/authService';
import {
  sendPhoneVerificationCode,
  verifyPhoneCode,
  getPhoneAuthErrorMessage,
  getPhoneAuthErrorCode,
  getLastDevVerificationCode,
  isPhoneAuthSupported,
  clearPendingPhoneVerification,
} from '@/features/auth/phoneAuthService';
import { useAuthStore } from '@/store/authStore';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';

const OTP_LENGTH = 6;

export default function PhoneVerificationScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const { firebaseUser, setBexUser } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [phoneSupported, setPhoneSupported] = useState(false);

  useEffect(() => {
    let active = true;
    isPhoneAuthSupported().then((supported) => {
      if (active) setPhoneSupported(supported);
    });
    return () => {
      active = false;
    };
  }, []);

  const goNext = async () => {
    if (firebaseUser) {
      const bexUser = await authService.getUserDocument(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });
      setBexUser(bexUser);
    }
    router.replace(AUTH_HOME_ROUTE);
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (step === 'otp') {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    return () => clearPendingPhoneVerification();
  }, []);

  const handleSendOTP = async () => {
    if (!phone.trim()) {
      setError(t('phoneVerificationScreen.errorPhoneRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPhoneVerificationCode(phone);
      setDevCode(getLastDevVerificationCode());
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('otp');
      setResendTimer(60);
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('[phone-verification] send OTP failed:', err);
      }
      setError(getPhoneAuthErrorMessage(getPhoneAuthErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

  const applyOtpDigits = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH)
      .fill('')
      .map((_, i) => digits[i] ?? '');
    setOtp(next);
    setError('');
    return digits;
  };

  const handleOtpChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      applyOtpDigits(digits);
      const focusIndex = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);
    setError('');

    if (digits && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError(t('phoneVerificationScreen.errorOtpLength'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyPhoneCode(code, phone);
      await goNext();
    } catch (err: unknown) {
      if (__DEV__) {
        console.error('[phone-verification] verify OTP failed:', err);
      }
      setError(getPhoneAuthErrorMessage(getPhoneAuthErrorCode(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    clearPendingPhoneVerification();
    goNext();
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
          {step === 'phone' && (
            <TouchableOpacity onPress={handleSkip} style={styles.skip}>
              <Text style={styles.skipText}>{t('phoneVerificationScreen.later')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.iconContainer}>
            <View style={styles.iconBg}>
              <Text style={styles.icon}>📱</Text>
            </View>
          </View>

          {Platform.OS === 'web' ? (
            <View nativeID="bex-recaptcha" style={styles.recaptchaHost} />
          ) : null}

          {step === 'phone' ? (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{t('phoneVerificationScreen.title')}</Text>
                <Text style={styles.subtitle}>
                  {t('phoneVerificationScreen.subtitle')}
                </Text>
              </View>

              {isAuthEmulatorActive() ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    {t('phoneVerificationScreen.emulatorHint')}
                  </Text>
                </View>
              ) : !phoneSupported ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    {t('phoneVerificationScreen.notSupportedHint')}
                  </Text>
                </View>
              ) : (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    {t('phoneVerificationScreen.backendHint')}
                  </Text>
                </View>
              )}

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.phoneContainer}>
                  <View style={styles.dialCode}>
                    <Text style={styles.dialCodeText}>🇹🇷 +90</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('phoneVerificationScreen.phonePlaceholder')}
                    placeholderTextColor={Colors.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={13}
                    editable={phoneSupported}
                  />
                </View>

                <Button
                  title={t('phoneVerificationScreen.sendCode')}
                  onPress={handleSendOTP}
                  loading={loading}
                  disabled={!phoneSupported}
                />

                <Button title={t('phoneVerificationScreen.skipForNow')} onPress={handleSkip} variant="ghost" />
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>{t('phoneVerificationScreen.enterCode')}</Text>
                <Text style={styles.subtitle}>
                  <Text style={styles.phoneHighlight}>{phone}</Text>
                  {t('phoneVerificationScreen.codeSentTo')}
                </Text>
              </View>

              {isAuthEmulatorActive() ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>
                    {t('phoneVerificationScreen.emulatorHint')}
                    {devCode ? t('phoneVerificationScreen.testCodeSuffix', { code: devCode }) : ''}
                  </Text>
                </View>
              ) : devCode ? (
                <View style={styles.hintBox}>
                  <Text style={styles.hintText}>{t('phoneVerificationScreen.devCode', { code: devCode })}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.otpRow}>
                  {otp.map((digit, i) => (
                    <TextInput
                      key={i}
                      ref={(ref) => {
                        otpRefs.current[i] = ref;
                      }}
                      style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, i)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, i)
                      }
                      keyboardType="number-pad"
                      maxLength={i === 0 ? OTP_LENGTH : 1}
                      textAlign="center"
                      selectionColor={Colors.primary}
                      textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                      autoComplete={i === 0 && Platform.OS === 'android' ? 'sms-otp' : 'off'}
                    />
                  ))}
                </View>

                <Button title={t('phoneVerificationScreen.verify')} onPress={handleVerifyOTP} loading={loading} />

                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>{t('phoneVerificationScreen.resendPrompt')}</Text>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimer}>{resendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOTP}>
                      <Text style={styles.resendLink}>{t('phoneVerificationScreen.resend')}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.changePhone}
                  onPress={() => {
                    clearPendingPhoneVerification();
                    setDevCode(null);
                    setStep('phone');
                    setOtp(Array(OTP_LENGTH).fill(''));
                  }}
                >
                  <Text style={styles.changePhoneText}>{t('phoneVerificationScreen.changePhone')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  skip: { alignSelf: 'flex-end' },
  skipText: { ...Typography.labelMedium, color: Colors.textSecondary },
  iconContainer: { alignItems: 'center', marginTop: Spacing[6] },
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
  phoneHighlight: { color: Colors.textPrimary, fontWeight: '600' },
  hintBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  hintText: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  form: { gap: Spacing[5] },
  errorBanner: {
    backgroundColor: Colors.errorLight,
    borderRadius: Radius.md,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  phoneContainer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  dialCode: {
    paddingHorizontal: Spacing[4],
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderRightColor: Colors.border,
    backgroundColor: Colors.surfaceSecondary,
  },
  dialCodeText: { ...Typography.labelMedium, color: Colors.textPrimary },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    ...Typography.bodyLarge,
    color: Colors.textPrimary,
  },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing[2] },
  otpBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
    textAlign: 'center',
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { ...Typography.bodySmall, color: Colors.textSecondary },
  resendLink: { ...Typography.labelMedium, color: Colors.primary },
  resendTimer: { ...Typography.labelMedium, color: Colors.textTertiary },
  changePhone: { alignItems: 'center' },
  changePhoneText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },
  recaptchaHost: { height: 1, overflow: 'hidden', opacity: 0 },
}));
