import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/features/auth/authService';
import { fetchBusinessProfile } from '@/features/auth/authApi';
import { useBusiness } from '@/features/business/useBusiness';
import { LocationPicker } from '@/components/common/LocationPicker';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button, Input } from '@/components/ui';
import {
  useBusinessCategoryLabels,
  useVerificationStatusLabels,
} from '@/constants/businessLabels';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function BusinessProfileScreen() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const BUSINESS_CATEGORY_LABELS = useBusinessCategoryLabels();
  const VERIFICATION_STATUS_LABELS = useVerificationStatusLabels();
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const { business, loading, reload } = useBusiness();
  const [city, setCity] = useState('İstanbul');
  const [district, setDistrict] = useState('');
  const [openAddress, setOpenAddress] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    fetchBusinessProfile()
      .then((profile) => {
        if (profile.city) setCity(profile.city);
        if (profile.district) setDistrict(profile.district);
        if (profile.openAddress) setOpenAddress(profile.openAddress);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      authService.refreshProfile().then((user) => {
        if (user) setBexUser(user);
      });
    }, [firebaseUser, setBexUser])
  );

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    setLocationMessage('');
    try {
      await authService.updateBusinessLocation(city, district, openAddress);
      setLocationMessage(t('businessProfileScreen.locationUpdated'));
      reload();
    } catch {
      setLocationMessage(t('businessProfileScreen.locationSaveFailed'));
    } finally {
      setSavingLocation(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/onboarding');
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const verificationStatus = business?.verificationStatus ?? 'none';

  return (
    <Screen style={styles.safe}>
      <AppHeader title={t('businessProfileScreen.headerTitle')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !business ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing[8] }} />
        ) : (
          <>
            <View style={styles.businessCard}>
              <Text style={styles.businessCardTitle}>{t('businessProfileScreen.businessInfoTitle')}</Text>
              <Text style={styles.businessName}>{business?.name ?? bexUser?.displayName ?? t('businessProfileScreen.defaultBusinessName')}</Text>
              {business?.category ? (
                <Text style={styles.businessMeta}>
                  {BUSINESS_CATEGORY_LABELS[business.category]}
                </Text>
              ) : null}
              {business?.address ? (
                <Text style={styles.businessMeta}>{business.address}</Text>
              ) : null}
              <View
                style={[
                  styles.verificationBadge,
                  verificationStatus === 'verified' && styles.verificationVerified,
                  verificationStatus === 'pending' && styles.verificationPending,
                  verificationStatus === 'rejected' && styles.verificationRejected,
                ]}
              >
                <Text style={styles.verificationText}>
                  {VERIFICATION_STATUS_LABELS[verificationStatus]}
                </Text>
              </View>

              {business?.id ? (
                <TouchableOpacity
                  onPress={() => router.push(`/business/${business.id}` as Href)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.link}>{t('businessProfileScreen.publicPageLink')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.locationCard}>
              <Text style={styles.businessCardTitle}>{t('businessProfileScreen.locationTitle')}</Text>
              <Text style={styles.locationHint}>
                {t('businessProfileScreen.locationHint')}
              </Text>
              <LocationPicker
                city={city}
                district={district}
                onCityChange={setCity}
                onDistrictChange={setDistrict}
              />
              <Input
                label={t('businessProfileScreen.openAddressLabel')}
                placeholder={t('businessProfileScreen.openAddressPlaceholder')}
                value={openAddress}
                onChangeText={setOpenAddress}
                multiline
                hint={t('businessProfileScreen.openAddressHint')}
              />
              <Button
                title={t('businessProfileScreen.saveLocation')}
                onPress={handleSaveLocation}
                loading={savingLocation}
                variant="secondary"
              />
              {locationMessage ? (
                <Text style={styles.locationMessage}>{locationMessage}</Text>
              ) : null}
            </View>

            <View style={styles.quickLinks}>
              {verificationStatus !== 'verified' ? (
                <Button
                  title={t('businessProfileScreen.kycButton')}
                  variant="secondary"
                  onPress={() => router.push('/(business)/verification' as Href)}
                />
              ) : null}
              {!bexUser?.phoneVerified ? (
                <Button
                  title={t('businessProfileScreen.verifyPhoneButton')}
                  variant="outline"
                  onPress={() => router.push('/(auth)/phone-verification' as Href)}
                />
              ) : null}
              <Button
                title={t('businessProfileScreen.subscriptionButton')}
                variant="outline"
                onPress={() => router.push('/(business)/subscription' as Href)}
              />
            </View>
          </>
        )}

        <AccountSettings
          bexUser={bexUser}
          onUserUpdated={setBexUser}
          showAdminLink={bexUser?.role === 'admin'}
        />

        <Button
          title={t('profileScreen.settings')}
          variant="primary"
          onPress={() => router.push('/settings' as Href)}
        />

        {__DEV__ ? (
          <Button
            title={t('businessProfileScreen.publishChecklist')}
            variant="outline"
            onPress={() => router.push('/setup-guide' as Href)}
          />
        ) : null}

        <Button title={t('businessProfileScreen.logout')} variant="outline" onPress={handleLogout} />

        <View style={styles.meta}>
          <Text style={styles.metaText}>Passla v{appVersion}</Text>
          {__DEV__ && (
            <Text style={styles.metaText}>
              {isAuthEmulatorActive() ? t('businessProfileScreen.emulatorDemo') : t('businessProfileScreen.liveBackend')}
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    alignItems: 'center',
    gap: Spacing[4],
  },
  businessCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  businessCardTitle: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  businessName: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
  },
  businessMeta: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing[1],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSecondary,
  },
  verificationVerified: { backgroundColor: Colors.successLight },
  verificationPending: { backgroundColor: Colors.warningLight },
  verificationRejected: { backgroundColor: Colors.errorLight },
  verificationText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  link: {
    ...Typography.labelMedium,
    color: Colors.primary,
    marginTop: Spacing[2],
  },
  quickLinks: {
    width: '100%',
    gap: Spacing[3],
  },
  locationCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  locationHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  locationMessage: {
    ...Typography.caption,
    color: Colors.primary,
  },
  meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
  metaText: { ...Typography.caption, color: Colors.textTertiary },
}));
