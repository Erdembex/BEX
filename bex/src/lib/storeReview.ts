import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const INSTALL_AT_KEY = '@passla/first_install_at_v1';
const REVIEW_SHOWN_KEY = '@passla/store_review_shown_v1';
const REVIEW_DELAY_MS = 24 * 60 * 60 * 1000;

async function getFirstInstallAt(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(INSTALL_AT_KEY);
    if (raw) {
      const parsed = Number(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
    const now = Date.now();
    await AsyncStorage.setItem(INSTALL_AT_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

export async function maybeRequestStoreReview(): Promise<void> {
  try {
    const shown = await AsyncStorage.getItem(REVIEW_SHOWN_KEY);
    if (shown === '1') return;

    const installAt = await getFirstInstallAt();
    if (Date.now() - installAt < REVIEW_DELAY_MS) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_SHOWN_KEY, '1');
  } catch {
    /* mağaza puanı isteği opsiyonel */
  }
}
