import { Alert, Platform } from 'react-native';
import { router, Href } from 'expo-router';
import { t } from '@/i18n';

function navigateToLogin(returnTo?: Href) {
  router.push({
    pathname: '/(auth)/login',
    params: returnTo ? { returnTo: String(returnTo) } : undefined,
  });
}

/** Oturumsuz kullanıcıya uyarı göster; yalnızca onayda giriş ekranına yönlendir. */
export function showLoginRequiredAlert(returnTo?: Href): void {
  const title = t('authRequired.alertTitle');
  const message = t('authRequired.alertBody');
  const cancelLabel = t('authRequired.alertCancel');
  const okLabel = t('authRequired.alertOk');

  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      navigateToLogin(returnTo);
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: okLabel, onPress: () => navigateToLogin(returnTo) },
  ]);
}
