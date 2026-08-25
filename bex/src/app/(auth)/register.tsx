import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@/components/common/Screen';
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
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { Button, Input, PasslaLogo } from '@/components/ui';
import { LocationPicker } from '@/components/common/LocationPicker';
import { PRIVACY_URL, TERMS_URL, openLegalPage } from '@/lib/legalLinks';
import { useTranslation } from '@/i18n';

export default function RegisterScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
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
    } catch (err: any) {
      const code: string = err?.code ?? '';
      const message = err?.message || getAuthErrorMessage(code);
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
          {/* Geri butonu */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>{t('registerScreen.back')}</Text>
          </TouchableOpacity>

          {/* Başlık */}
          <View style={styles.header}>
            <PasslaLogo size="md" centered tone="onDark" />
            <Text style={styles.title}>{t('registerScreen.title')}</Text>
            <Text style={styles.subtitle}>
              {t('registerScreen.subtitle')}
            </Text>
          </View>

          {/* Rol seçimi */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>{t('registerScreen.accountType')}</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={[
                    styles.roleCard,
                    role === r.id && styles.roleCardActive,
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text
                    style={[
                      styles.roleLabel,
                      role === r.id && styles.roleLabelActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                  {role === r.id && (
                    <View style={styles.roleCheck}>
                      <Text style={styles.roleCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.demographicsSection}>
            <Input
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
            <Text style={styles.locationNote}>
              {t('registerScreen.locationNote')}
            </Text>
          ) : null}

          {role === 'business' ? (
            <Input
              label={t('registerScreen.openAddressLabel')}
              placeholder={t('registerScreen.openAddressPlaceholder')}
              value={openAddress}
              onChangeText={setOpenAddress}
              error={errors.openAddress}
              multiline
              hint={t('registerScreen.openAddressHint')}
            />
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {errors.general && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            <Input
              label={role === 'business' ? t('registerScreen.businessNameLabel') : t('registerScreen.fullNameLabel')}
              placeholder={role === 'business' ? t('registerScreen.businessNamePlaceholder') : t('registerScreen.fullNamePlaceholder')}
              value={displayName}
              onChangeText={setDisplayName}
              error={errors.displayName}
              autoComplete="name"
              textContentType="name"
            />

            <Input
              label={t('registerScreen.emailLabel')}
              placeholder={t('registerScreen.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />

            {__DEV__ ? (
              <Text style={styles.devHint}>
                {t('registerScreen.devHint')}
              </Text>
            ) : null}

            <Input
              label={t('registerScreen.passwordLabel')}
              placeholder={t('registerScreen.passwordPlaceholder')}
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              isPassword
              hint={t('registerScreen.passwordHint')}
            />

            <Input
              label={t('registerScreen.confirmPasswordLabel')}
              placeholder={t('registerScreen.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              isPassword
            />

            {/* Yasal onay */}
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

            <Button
              title={t('registerScreen.submit')}
              onPress={handleRegister}
              loading={loading}
            />
          </View>

          {/* Giriş yap linki */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t('registerScreen.haveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>{t('registerScreen.login')}</Text>
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
    paddingTop: Spacing[6],
    paddingBottom: Spacing[8],
    gap: Spacing[6],
  },
  back: {
    alignSelf: 'flex-start',
  },
  backText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  header: {
    gap: Spacing[3],
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.textPrimary,
    marginTop: Spacing[2],
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  roleSection: {
    gap: Spacing[3],
  },
  demographicsSection: {
    gap: Spacing[4],
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
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  genderChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  genderChipText: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
  },
  genderChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  fieldError: {
    ...Typography.caption,
    color: Colors.error,
  },
  locationNote: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: -Spacing[2],
  },
  sectionLabel: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
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
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
    position: 'relative',
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  roleLabel: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  roleLabelActive: {
    color: Colors.textPrimary,
  },
  roleDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  roleCheck: {
    position: 'absolute',
    top: Spacing[2],
    right: Spacing[2],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textOnPrimary,
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
  devHint: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
    marginTop: -Spacing[2],
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    marginTop: -Spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  checkboxMark: {
    ...Typography.labelSmall,
    color: Colors.white,
    fontWeight: '800',
  },
  termsText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  termsError: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: -Spacing[3],
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  loginText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
  loginLink: {
    ...Typography.labelLarge,
    color: Colors.primary,
  },
}));
