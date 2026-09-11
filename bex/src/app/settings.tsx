import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { router, Href } from 'expo-router';
import { useFocusEffect } from "expo-router/react-navigation";
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useLocaleStore, type AppLocale } from '@/store/localeStore';
import { authService } from '@/features/auth/authService';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { API_BASE_URL } from '@/lib/api/config';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { AppHeader } from '@/components/navigation/AppHeader';
import { exportAccountDataToFile } from '@/features/account/exportAccountData';
import { PRIVACY_URL, TERMS_URL, openLegalPage } from '@/lib/legalLinks';
import { getAppCacheSizeLabel, clearAppCache } from '@/lib/appCache';
import { Button } from '@/components/ui';
import { Typography, Spacing, useThemeColors, useIsDarkMode } from '@/theme';
import { useTranslation } from '@/i18n';

export default function SettingsScreen() {
  const { bexUser, firebaseUser, setBexUser, signOut } = useAuthStore();
  const { reachable } = useBackendHealth();
  const Colors = useThemeColors();
  const isDark = useIsDarkMode();
  const toggleTheme = useThemeStore((s) => s.toggleMode);
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [exporting, setExporting] = useState(false);
  const [dataError, setDataError] = useState('');
  const [cacheSize, setCacheSize] = useState('—');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      void getAppCacheSizeLabel().then(setCacheSize);
      if (!firebaseUser) return;
      authService
        .getUserDocument(firebaseUser.uid, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        })
        .then(setBexUser);
    }, [firebaseUser, setBexUser])
  );

  const handleClearCache = async () => {
    setClearingCache(true);
    setCacheMessage('');
    try {
      await clearAppCache();
      const size = await getAppCacheSizeLabel();
      setCacheSize(size);
      setCacheMessage(t('settings.cacheCleared'));
    } catch {
      setCacheMessage(t('settings.cacheClearFailed'));
    } finally {
      setClearingCache(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    signOut();
    router.replace('/(auth)/login');
  };

  const handleExportData = async () => {
    setExporting(true);
    setDataError('');
    try {
      await exportAccountDataToFile();
    } catch (err: any) {
      setDataError(err?.message || t('settings.downloadFailed'));
    } finally {
      setExporting(false);
    }
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen style={styles.safe}>
      <AppHeader title={t('settings.title')} showMenu={false} showNotifications={false} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {firebaseUser ? (
          <TouchableOpacity
            style={styles.quickLink}
            activeOpacity={0.88}
            onPress={() => router.push('/blocked-users' as Href)}
          >
            <Text style={styles.quickLinkIcon}>⊘</Text>
            <View style={styles.quickLinkBody}>
              <Text style={styles.quickLinkTitle}>{t('settings.blockedUsers')}</Text>
              <Text style={styles.quickLinkHint}>{t('settings.blockedUsersHint')}</Text>
            </View>
            <Text style={styles.quickLinkChevron}>›</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language.sectionTitle')}</Text>
          <View style={styles.langRow}>
            {(['tr', 'en'] as AppLocale[]).map((code) => {
              const active = locale === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.langBtn, active && styles.langBtnActive]}
                  onPress={() => setLocale(code)}
                  activeOpacity={0.88}
                >
                  <Text style={[styles.langBtnText, active && styles.langBtnTextActive]}>
                    {code === 'tr' ? t('language.turkish') : t('language.english')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.rowHint}>
            {locale === 'tr' ? t('language.turkishActive') : t('language.englishActive')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('settings.darkMode')}</Text>
              <Text style={styles.rowHint}>
                {isDark ? t('settings.darkModeOn') : t('settings.darkModeOff')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.storage')}</Text>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('settings.cacheSize')}</Text>
              <Text style={styles.rowHint}>{t('settings.cacheSizeHint')}</Text>
            </View>
            <Text style={styles.cacheValue}>{cacheSize}</Text>
          </View>
          {cacheMessage ? <Text style={styles.rowHint}>{cacheMessage}</Text> : null}
          <Button
            title={t('settings.clearCache')}
            variant="outline"
            onPress={handleClearCache}
            loading={clearingCache}
          />
          <Text style={styles.rowHint}>{t('settings.clearCacheHint')}</Text>
        </View>

        {firebaseUser ? (
          <AccountSettings
            bexUser={bexUser}
            onUserUpdated={setBexUser}
            showAdminLink={bexUser?.role === 'admin'}
          />
        ) : null}

        {firebaseUser ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.dataAndAccount')}</Text>

          {dataError ? <Text style={styles.errorText}>{dataError}</Text> : null}

          <Button
            title={t('settings.downloadMyData')}
            variant="outline"
            onPress={handleExportData}
            loading={exporting}
          />
          <Text style={styles.rowHint}>{t('settings.downloadMyDataHint')}</Text>

          <Button
            title={t('settings.deleteAccount')}
            variant="danger"
            onPress={() => router.push('/delete-account' as Href)}
          />
          <Text style={styles.rowHint}>{t('settings.deleteAccountHint')}</Text>
        </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.legal')}</Text>
          <Button
            title={t('settings.terms')}
            variant="ghost"
            onPress={() => openLegalPage(TERMS_URL)}
          />
          <Button
            title={t('settings.privacy')}
            variant="ghost"
            onPress={() => openLegalPage(PRIVACY_URL)}
          />
        </View>

        <Button
          title={t('settings.aboutPassla')}
          variant="outline"
          onPress={() => router.push('/about' as Href)}
        />

        {__DEV__ ? (
          <>
            <Button
              title={t('settings.expoGuide')}
              variant="primary"
              onPress={() => router.push('/expo-test-guide' as Href)}
            />

            <Button
              title={t('settings.releaseChecklist')}
              variant="outline"
              onPress={() => router.push('/setup-guide' as Href)}
            />
          </>
        ) : null}

        {firebaseUser ? (
          <Button title={t('common.logout')} variant="outline" onPress={handleLogout} />
        ) : null}

        <View style={styles.meta}>
          <Text style={styles.metaText}>Passla v{appVersion}</Text>
          {__DEV__ && (
            <>
              <Text style={styles.metaText}>
                {isAuthEmulatorActive() ? t('settings.emulatorDemo') : t('settings.restLive')}
              </Text>
              <Text style={styles.metaText}>API: {API_BASE_URL}</Text>
              {!isAuthEmulatorActive() && reachable !== null ? (
                <Text style={styles.metaText}>
                  {reachable ? t('settings.serverReachable') : t('settings.serverUnreachable')}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function createStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    scroll: {
      padding: Spacing[5],
      paddingBottom: Spacing[10],
      alignItems: 'center',
      gap: Spacing[4],
    },
    quickLink: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing[3],
      backgroundColor: Colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingVertical: Spacing[3],
      paddingHorizontal: Spacing[4],
    },
    quickLinkIcon: {
      width: 24,
      textAlign: 'center',
      fontSize: 18,
      color: Colors.textSecondary,
      fontWeight: '700',
    },
    quickLinkBody: { flex: 1, gap: 2 },
    quickLinkTitle: {
      ...Typography.labelMedium,
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    quickLinkHint: { ...Typography.caption, color: Colors.textTertiary },
    quickLinkChevron: {
      ...Typography.headingMedium,
      color: Colors.textMuted,
      fontWeight: '300',
    },
    back: { alignSelf: 'flex-start' },
    backText: { ...Typography.labelMedium, color: Colors.textSecondary },
    title: {
      ...Typography.headingLarge,
      color: Colors.textPrimary,
      alignSelf: 'flex-start',
    },
    section: {
      width: '100%',
      backgroundColor: Colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing[4],
      gap: Spacing[3],
    },
    sectionTitle: {
      ...Typography.labelMedium,
      color: Colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    langRow: {
      flexDirection: 'row',
      gap: Spacing[2],
    },
    langBtn: {
      flex: 1,
      paddingVertical: Spacing[3],
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      alignItems: 'center',
    },
    langBtnActive: {
      borderColor: Colors.primary,
      backgroundColor: Colors.primaryLight,
    },
    langBtnText: {
      ...Typography.labelMedium,
      color: Colors.textSecondary,
      fontWeight: '600',
    },
    langBtnTextActive: {
      color: Colors.textPrimary,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowText: { flex: 1, gap: 2 },
    rowLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
    rowHint: { ...Typography.caption, color: Colors.textTertiary },
    cacheValue: { ...Typography.labelMedium, color: Colors.textPrimary, fontWeight: '700' },
    errorText: { ...Typography.bodySmall, color: Colors.error },
    meta: { alignItems: 'center', gap: Spacing[1], marginTop: Spacing[2] },
    metaText: { ...Typography.caption, color: Colors.textTertiary },
  });
}
