import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (userId: string) => `@passla/saved_listings/v1/${userId}`;

export async function loadSavedListingIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export async function saveSavedListingIds(userId: string, ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(ids));
  } catch {
    // Non-critical — favorites may not persist until next successful write.
  }
}

export async function clearSavedListingIds(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
