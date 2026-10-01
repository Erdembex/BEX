import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
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
  isRegistrationAgeValid,
  parseBirthDateInput,
} from '@/lib/birthDateUtils';
import { Typography, Spacing, Radius } from '@/theme';
import { Input } from '@/components/ui';
import { LocationPicker } from '@/components/common/LocationPicker';
import { PRIVACY_URL, TERMS_URL, openLegalPage } from '@/lib/legalLinks';
import { useTranslation } from '@/i18n';
import { AuthBrandedScreen } from '@/components/auth/AuthBrandedScreen';
import { AUTH_SHEET } from '@/components/auth/authSheetPalette';
import { androidTextLayout } from '@/lib/androidUi';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const ROLES: { id: UserRole; label: string; desc: string; emoji: string }[] = [
    {
      id: 'user',
      label: t('registerScreen.roleUser'),
      desc: t('registerScreen.roleUserDesc'),
      emoji: '🎯',
    },
    {
      id: 'business',
      label: t('registerScreen.roleBusiness'),
      desc: t('registerScreen.roleBusinessDesc'),
      emoji: '🏢',
    },
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
      scrollBody
      showHero={false}
      onBack={goBackFromRegister}
      backLabel={t('registerScreen.back')}
      sheetStyle={styles.sheetExtra}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('registerScreen.title')}</Text>
        <Text style={styles.subtitle}>{t('registerScreen.subtitle')}</Text>
      </View>

      <View style={styles.roleSection}>
        <Text style={styles.sectionLabel}>{t('registerScreen.accountType')}</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.id}
              onPress={() => setRole(r.id)}
              style={[styles.roleCard, role === r.id && styles.roleCardActive]}
              activeOpacity={0.75}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <Text style={[styles.roleLabel, role === r.id && styles.roleLabelActive]}>
                {r.label}
              </Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
              {role === r.id ? (
                <View style={styles.roleCheck}>
                  <Text style={styles.roleCheckText}>✓</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.demographicsSection}>
        <Input
          variant="frost"
          label={t('registerScreen.birthDateLabel')}
          placeholder={t('registerScreen.birthDatePlaceholder')}
          value={birthDateInput}
          onChangeText={setBirthDateInput}
          error={errors.birthDate}
          keyboardType="numbers-and-punctuation"
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
                  style={[styles.genderChip, selected && styles.genderChipActive]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.genderChipText, selected && styles.genderChipTextActive]}>
                    {option.label}
                  </Text>
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
      />
      {role === 'business' ? (
        <Text style={styles.locationNote}>{t('registerScreen.locationNote')}</Text>
      ) : null}

      {role === 'business' ? (
        <Input
          variant="frost"
          label={t('registerScreen.openAddressLabel')}
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

        <Input
          variant="frost"
          label={
            role === 'business'
              ? t('registerScreen.businessNameLabel')
              : t('registerScreen.fullNameLabel')
          }
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

        <Input
          variant="frost"
          label={t('registerScreen.emailLabel')}
          placeholder={t('registerScreen.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />

        {__DEV__ ? <Text style={styles.devHint}>{t('registerScreen.devHint')}</Text> : null}

        <Input
          variant="frost"
          label={t('registerScreen.passwordLabel')}
          placeholder={t('registerScreen.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          isPassword
          hint={t('registerScreen.passwordHint')}
        />

        <Input
          variant="frost"
          label={t('registerScreen.confirmPasswordLabel')}
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
          <Text style={styles.submitLabel}>
            {loading ? '...' : `${t('registerScreen.submit')}  →`}
          </Text>
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
  sheetExtra: {
    marginTop: -Spacing[2],
  },
  header: {
    gap: Spacing[1],
    marginBottom: Spacing[2],
  },
  title: {
    ...Typography.headingLarge,
    color: AUTH_SHEET.ink,
    fontSize: 26,
    lineHeight: 32,
    ...androidTextLayout,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: AUTH_SHEET.body,
    lineHeight: 22,
    fontSize: 15,
    ...androidTextLayout,
  },
  roleSection: {
    gap: Spacing[3],
    marginTop: Spacing[2],
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
  genderChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: AUTH_SHEET.surfaceBorder,
    backgroundColor: AUTH_SHEET.surface,
  },
  genderChipActive: {
    borderColor: AUTH_SHEET.ink,
    backgroundColor: 'rgba(23, 38, 79, 0.08)',
  },
  genderChipText: {
    ...Typography.labelMedium,
    color: AUTH_SHEET.muted,
  },
  genderChipTextActive: {
    color: AUTH_SHEET.ink,
    fontWeight: '700',
  },
  fieldError: {
    ...Typography.caption,
    color: AUTH_SHEET.error,
  },
  locationNote: {
    ...Typography.caption,
    color: AUTH_SHEET.muted,
    marginTop: -Spacing[2],
  },
  sectionLabel: {
    ...Typography.labelMedium,
    color: AUTH_SHEET.ink,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  roleCard: {
    flex: 1,
    padding: Spacing[4],
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: AUTH_SHEET.surfaceBorder,
    backgroundColor: AUTH_SHEET.surface,
    gap: 4,
    position: 'relative',
  },
  roleCardActive: {
    borderColor: AUTH_SHEET.ink,
    backgroundColor: 'rgba(23, 38, 79, 0.08)',
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleLabel: {
    ...Typography.labelLarge,
    color: AUTH_SHEET.body,
  },
  roleLabelActive: {
    color: AUTH_SHEET.ink,
  },
  roleDesc: {
    ...Typography.caption,
    color: AUTH_SHEET.muted,
  },
  roleCheck: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AUTH_SHEET.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: AUTH_SHEET.ink,
    backgroundColor: AUTH_SHEET.surface,
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
    borderColor: AUTH_SHEET.ink,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: AUTH_SHEET.ink,
  },
  checkboxMark: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  termsText: {
    ...Typography.caption,
    color: AUTH_SHEET.body,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: AUTH_SHEET.ink,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsError: {
    ...Typography.caption,
    color: AUTH_SHEET.error,
    marginTop: -Spacing[3],
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: Radius.full,
    backgroundColor: AUTH_SHEET.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    marginTop: Spacing[1],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontSize: 17,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[4],
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  loginText: {
    ...Typography.bodyMedium,
    color: AUTH_SHEET.muted,
    fontSize: 14,
  },
  loginLink: {
    ...Typography.labelLarge,
    color: AUTH_SHEET.ink,
    fontSize: 15,
  },
});
