import { apiClient } from '@/lib/api';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { shouldUseDemoData } from '@/lib/devMode';

type SavedListingsResponse = {
  listingIds?: string[];
};

export async function canSyncSavedListingsToServer(): Promise<boolean> {
  if (shouldUseDemoData()) return false;
  return hasRestAuthSession();
}

export async function fetchSavedListingIdsFromServer(): Promise<string[]> {
  const { data } = await apiClient.get<SavedListingsResponse>('/api/listings/favorites');
  return (data.listingIds ?? []).map(String);
}

export async function addSavedListingOnServer(listingId: string): Promise<void> {
  await apiClient.post(`/api/listings/${listingId}/favorite`);
}

export async function removeSavedListingOnServer(listingId: string): Promise<void> {
  await apiClient.delete(`/api/listings/${listingId}/favorite`);
}
