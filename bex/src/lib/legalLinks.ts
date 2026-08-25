import { Linking } from 'react-native';

const WEBSITE_BASE_URL = 'https://passla.com.tr';

export const TERMS_URL = `${WEBSITE_BASE_URL}/kullanim-kosullari.html`;
export const PRIVACY_URL = `${WEBSITE_BASE_URL}/gizlilik.html`;
export const SUPPORT_URL = `${WEBSITE_BASE_URL}/destek.html`;
export const ACCOUNT_DELETION_URL = `${WEBSITE_BASE_URL}/hesap-silme.html`;

export async function openLegalPage(url: string): Promise<void> {
  await Linking.openURL(url);
}
