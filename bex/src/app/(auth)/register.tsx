import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { authService, getAuthErrorMessage } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { clearTokens } from '@/lib/auth/tokenStorage';
import { UserRole, UserGender } from '@/types';
import {
  calculateAge,
  formatBirthDateIso,
  formatBirthDateTyping,
  isRegistrationAgeValid,
  parseBirthDateInput,
} from '@/lib/birthDateUtils';
import { Typography, Spacing, Radius, FontFamily } from '@/theme';

const NAVY = '#051F45';
const CREAM = '#F0EEE9';
const SS_MARK = require('../../../assets/branding/splash-ss-white.png');
import { Input } from '@/components/ui';
import { LocationPicker } from '@/components/common/LocationPicker';
import { PRIVACY_URL, TERMS_URL, openLegalPage } from '@/lib/legalLinks';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { androidTextLayout } from '@/lib/androidUi';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const ROLES: { id: UserRole; label: string }[] = [
    { id: 'user', label: t('registerScreen.roleUser') },
    { id: 'business', label: t('registerScreen.roleBusiness') },
  ];
  const { signOut } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('Kadıköy');
  const [openAddress, setOpenAddress] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [gender, setGender] = useState<UserGender | null>(null);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenLegal = async (url: string) => {
    try {
      await openLegalPage(url);
    } catch {
      setErrors((prev) => ({ ...prev, terms: t('registerScreen.legalLinkFailed') }));
    }
  };

  const parsedBirthDate = useMemo(() => parseBirthDateInput(birthDateInput), [birthDateInput]);
  const computedAge = parsedBirthDate ? calculateAge(parsedBirthDate) : null;

  const goBackFromRegister = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(auth)/login');
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBackFromRegister();
      return true;
    });
    return () => sub.remove();
  }, [goBackFromRegister]);

  const GENDERS: { id: UserGender; label: string }[] = [
    { id: 'MALE', label: t('registerScreen.genderMale') },
    { id: 'FEMALE', label: t('registerScreen.genderFemale') },
    { id: 'OTHER', label: t('registerScreen.genderOther') },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!displayName.trim() || displayName.trim().length < 2) {
      newErrors.displayName = t('registerScreen.errorName');
    }
    if (!email.trim() || !email.includes('@')) {
      newErrors.email = t('registerScreen.errorEmail');
    }
    if (password.length < 8) {
      newErrors.password = t('registerScreen.errorPassword');
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('registerScreen.errorConfirmPassword');
    }
    if (!city.trim()) {
      newErrors.location = t('registerScreen.errorCity');
    }
    if (!district.trim()) {
      newErrors.location = t('registerScreen.errorDistrict');
    }
    if (role === 'business' && openAddress.trim().length < 10) {
      newErrors.openAddress = t('registerScreen.errorOpenAddress');
    }
    if (!parsedBirthDate) {
      newErrors.birthDate = t('registerScreen.errorBirthDate');
    } else if (!isRegistrationAgeValid(parsedBirthDate)) {
      newErrors.birthDate = t('registerScreen.errorAge');
    }
    if (!gender) {
      newErrors.gender = t('registerScreen.errorGender');
    }
    if (!termsAccepted) {
      newErrors.terms = t('registerScreen.errorTermsNotAccepted');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await clearTokens();
      signOut();

      const result = await authService.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
        city,
        district,
        birthDate: formatBirthDateIso(parsedBirthDate!),
        gender: gender!,
        ...(role === 'business' ? { openAddress: openAddress.trim() } : {}),
      });

      router.replace({
        pathname: '/(auth)/email-verification',
        params: {
          email: result.email,
          ...(__DEV__ && result.devVerificationCode
            ? { devCode: result.devVerificationCode }
            : {}),
        },
      });
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      const code = authErr?.code ?? '';
      const message = authErr?.message || getAuthErrorMessage(code);
      console.error('[RegisterScreen] Kayıt hatası:', code, message);

      if (code === 'auth/email-already-in-use') {
        setErrors({ email: message });
      } else if (code === 'auth/weak-password') {
        setErrors({ password: message });
      } else if (code === 'auth/invalid-email') {
        setErrors({ email: message });
      } else if (code === 'invalid-open-address') {
        setErrors({ openAddress: message });
      } else if (message.includes('13 yaş')) {
        setErrors({ birthDate: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthBrandedScreen
      bare
      scrollBody
      onBack={goBackFromRegister}
      backLabel={t('registerScreen.back')}
    >
      <Image source={SS_MARK} style={styles.mark} resizeMode="contain" accessibilityIgnoresInvertColors />
      <Text style={styles.title}>{t('registerScreen.title')}</Text>

      <View style={styles.roleSection}>
        <Text style={styles.sectionLabel}>{t('registerScreen.accountType')}</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => {
            const selected = role === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setRole(r.id)}
                style={[styles.pill, selected && styles.pillOn]}
                activeOpacity={0.85}
              >
                <Text style={[styles.pillText, selected && styles.pillTextOn]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.demographicsSection}>
        <Text style={styles.sectionLabel}>{t('registerScreen.birthDateLabel')}</Text>
        <Input
          variant="frost"
          placeholder={t('registerScreen.birthDatePlaceholder')}
          value={birthDateInput}
          onChangeText={(text) => setBirthDateInput((prev) => formatBirthDateTyping(text, prev))}
          error={errors.birthDate}
          keyboardType="number-pad"
          maxLength={10}
          hint={
            computedAge != null && !errors.birthDate
              ? t('registerScreen.ageLabel', { age: computedAge })
              : t('registerScreen.birthDateHint')
          }
        />

        <View style={styles.genderSection}>
          <Text style={styles.sectionLabel}>{t('registerScreen.genderLabel')}</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((option) => {
              const selected = gender === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setGender(option.id)}
                  style={[styles.pill, styles.genderPill, selected && styles.pillOn]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.pillText, selected && styles.pillTextOn]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.gender ? <Text style={styles.fieldError}>{errors.gender}</Text> : null}
        </View>
      </View>

      <LocationPicker
        city={city}
        district={district}
        onCityChange={setCity}
        onDistrictChange={setDistrict}
        error={errors.location}
        appearance="sheet"
      />
      {role === 'business' ? (
        <Text style={styles.locationNote}>{t('registerScreen.locationNote')}</Text>
      ) : null}

      {role === 'business' ? (
        <Text style={styles.sectionLabel}>{t('registerScreen.openAddressLabel')}</Text>
        <Input
          variant="frost"
          placeholder={t('registerScreen.openAddressPlaceholder')}
          value={openAddress}
          onChangeText={setOpenAddress}
          error={errors.openAddress}
          multiline
          hint={t('registerScreen.openAddressHint')}
        />
      ) : null}

      <View style={styles.form}>
        {errors.general ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{errors.general}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>
          {role === 'business'
            ? t('registerScreen.businessNameLabel')
            : t('registerScreen.fullNameLabel')}
        </Text>
        <Input
          variant="frost"
          placeholder={
            role === 'business'
              ? t('registerScreen.businessNamePlaceholder')
              : t('registerScreen.fullNamePlaceholder')
          }
          value={displayName}
          onChangeText={setDisplayName}
          error={errors.displayName}
          autoComplete="name"
          textContentType="name"
        />

        <Text style={styles.sectionLabel}>{t('registerScreen.emailLabel')}</Text>
        <Input
          variant="frost"
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        {__DEV__ ? <Text style={styles.devHint}>{t('registerScreen.devHint')}</Text> : null}

        <Text style={styles.sectionLabel}>{t('registerScreen.passwordLabel')}</Text>
        <Input
          variant="frost"
          placeholder={t('registerScreen.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          isPassword
          hint={t('registerScreen.passwordHint')}
        />

        <Text style={styles.sectionLabel}>{t('registerScreen.confirmPasswordLabel')}</Text>
        <Input
          variant="frost"
          placeholder={t('registerScreen.confirmPasswordPlaceholder')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          isPassword
        />

        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTermsAccepted((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
        >
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.termsText}>
            {t('registerScreen.termsPrefix')}
            <Text style={styles.termsLink} onPress={() => handleOpenLegal(TERMS_URL)}>
              {t('registerScreen.termsOfService')}
            </Text>
            {t('registerScreen.termsMiddle')}
            <Text style={styles.termsLink} onPress={() => handleOpenLegal(PRIVACY_URL)}>
              {t('registerScreen.privacyPolicy')}
            </Text>
            {t('registerScreen.termsSuffix')}
          </Text>
        </TouchableOpacity>
        {errors.terms ? <Text style={styles.termsError}>{errors.terms}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          <Text style={styles.submitLabel}>{loading ? '...' : t('registerScreen.submit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.loginRow}>
        <Text style={styles.loginText}>{t('registerScreen.haveAccount')}</Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.loginLink}>{t('registerScreen.login')}</Text>
        </TouchableOpacity>
      </View>
    </AuthBrandedScreen>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 124,
    height: 72,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.1,
    color: CREAM,
    marginBottom: 26,
    ...androidTextLayout,
  },
  roleSection: {
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  pill: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(240,238,233,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  pillOn: {
    backgroundColor: CREAM,
    borderColor: CREAM,
  },
  pillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: CREAM,
  },
  pillTextOn: {
    color: NAVY,
  },
  genderPill: {
    flex: 1,
  },
  demographicsSection: {
    gap: Spacing[4],
    marginTop: Spacing[2],
  },
  genderSection: {
    gap: Spacing[2],
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  fieldError: {
    ...Typography.caption,
    color: '#F0B4B4',
  },
  locationNote: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.62)',
    marginTop: -Spacing[2],
  },
  sectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    color: 'rgba(240,238,233,0.78)',
    marginLeft: 8,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  form: {
    gap: Spacing[4],
    marginTop: Spacing[2],
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
  devHint: {
    ...Typography.caption,
    color: CREAM,
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginTop: -Spacing[2],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    marginTop: -Spacing[1],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: CREAM,
    borderColor: CREAM,
  },
  checkboxMark: {
    ...Typography.labelSmall,
    color: NAVY,
    fontWeight: '800',
  },
  termsText: {
    ...Typography.caption,
    color: 'rgba(240,238,233,0.78)',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: CREAM,
    fontWeight: '700',
  },
  termsError: {
    ...Typography.caption,
    color: AUTH_SHEET.error,
    marginTop: -Spacing[3],
  },
  submitBtn: {
    minHeight: 56,
    borderRadius: Radius.full,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    fontFamily: FontFamily.bold,
    color: NAVY,
    fontSize: 17,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  loginText: {
    fontFamily: FontFamily.regular,
    color: 'rgba(240,238,233,0.72)',
    fontSize: 15,
  },
  loginLink: {
    fontFamily: FontFamily.bold,
    color: CREAM,
    fontSize: 15,
  },
});
