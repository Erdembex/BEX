import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Platform, StyleSheet } from 'react-native';
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
import { Typography, Spacing, Radius, FontFamily } from '@/theme';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { readableTextInputStyle, textInputPaddingVertical } from '@/lib/textInputStyle';
import { androidTextLayout } from '@/lib/androidUi';

const OTP_LENGTH = 6;
const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const INK = '#17264F';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');

export default function PhoneVerificationScreen() {
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
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => otpRefs.current[0]?.focus(), 300);
      return () => clearTimeout(timer);
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

  const backToPhone = () => {
    clearPendingPhoneVerification();
    setDevCode(null);
    setStep('phone');
    setOtp(Array(OTP_LENGTH).fill(''));
  };

  return (
    <AuthBrandedScreen
      bare
      scrollBody
      center
      onBack={step === 'otp' ? backToPhone : undefined}
      backLabel={t('common.back')}
      headerRight={
        step === 'phone' ? (
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.later}>{t('phoneVerificationScreen.later')}</Text>
          </TouchableOpacity>
        ) : null
      }
    >
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />

      {Platform.OS === 'web' ? <View nativeID="bex-recaptcha" style={styles.recaptchaHost} /> : null}

      {step === 'phone' ? (
        <>
          <Text style={styles.title}>{t('phoneVerificationScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('phoneVerificationScreen.subtitle')}</Text>

          {__DEV__ && isAuthEmulatorActive() ? (
            <Text style={styles.note}>{t('phoneVerificationScreen.emulatorHint')}</Text>
          ) : !phoneSupported ? (
            <Text style={styles.note}>{t('phoneVerificationScreen.notSupportedHint')}</Text>
          ) : null}

          <View style={styles.form}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>{t('phoneVerificationScreen.phoneLabel')}</Text>
            <View style={styles.phoneRow}>
              <View style={styles.dial}>
                <Text style={styles.dialText}>+90</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder={t('phoneVerificationScreen.phonePlaceholder')}
                placeholderTextColor="#64708C"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={13}
                editable={phoneSupported}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!phoneSupported || loading) && styles.submitBtnDisabled]}
              onPress={handleSendOTP}
              disabled={!phoneSupported || loading}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.submitLabel}>
                {loading ? '...' : t('phoneVerificationScreen.sendCode')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t('phoneVerificationScreen.skipForNow')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.title}>{t('phoneVerificationScreen.enterCode')}</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.phoneMark}>{phone}</Text>
            {t('phoneVerificationScreen.codeSentTo')}
          </Text>

          {__DEV__ && devCode ? (
            <Text style={styles.note}>
              {isAuthEmulatorActive()
                ? `${t('phoneVerificationScreen.emulatorHint')}${t('phoneVerificationScreen.testCodeSuffix', { code: devCode })}`
                : t('phoneVerificationScreen.devCode', { code: devCode })}
            </Text>
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
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={i === 0 ? OTP_LENGTH : 1}
                  textAlign="center"
                  selectionColor={INK}
                  textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                  autoComplete={i === 0 && Platform.OS === 'android' ? 'sms-otp' : 'off'}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.submitLabel}>
                {loading ? '...' : t('phoneVerificationScreen.verify')}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>{t('phoneVerificationScreen.resendPrompt')}</Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>{resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
                  <Text style={styles.resendLink}>{t('phoneVerificationScreen.resend')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity onPress={backToPhone} style={styles.linkBtn}>
              <Text style={styles.linkText}>{t('phoneVerificationScreen.changePhone')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  later: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: CREAM,
    ...androidTextLayout,
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
  phoneMark: {
    fontFamily: FontFamily.bold,
    color: CREAM,
  },
  note: {
    ...Typography.bodySmall,
    color: 'rgba(240,238,233,0.72)',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: -12,
    marginBottom: 16,
  },
  form: { gap: Spacing[3] },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(240,238,233,0.78)',
    marginLeft: 8,
    marginBottom: 8,
  },
  phoneRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#C4B48A',
    overflow: 'hidden',
  },
  dial: {
    paddingHorizontal: Spacing[4],
    height: '100%',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#C4B48A',
  },
  dialText: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: INK,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: INK,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
  },
  errorBanner: {
    borderRadius: Radius.xl,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(240,180,180,0.45)',
    backgroundColor: 'rgba(240,180,180,0.12)',
  },
  errorText: {
    ...Typography.bodySmall,
    color: '#F0B4B4',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  otpBox: {
    flex: 1,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C4B48A',
    backgroundColor: 'rgba(255,255,255,0.94)',
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: INK,
    paddingVertical: textInputPaddingVertical,
    ...readableTextInputStyle,
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: CREAM,
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
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
    textAlign: 'center',
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
  recaptchaHost: { height: 1, overflow: 'hidden', opacity: 0 },
});
