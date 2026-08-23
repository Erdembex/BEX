import { create } from 'zustand';
import {
  addSavedListingOnServer,
  canSyncSavedListingsToServer,
  fetchSavedListingIdsFromServer,
  removeSavedListingOnServer,
} from '@/features/listing/savedListingsApi';
import {
  clearSavedListingIds,
  loadSavedListingIds,
  saveSavedListingIds,
} from '@/lib/savedListingsStorage';

interface SavedListingsState {
  userId: string | null;
  ids: string[];
  ready: boolean;
  hydrate: (userId: string | null) => Promise<void>;
  toggle: (listingId: string) => Promise<boolean>;
  isSaved: (listingId: string) => boolean;
  refresh: () => Promise<void>;
}

export const useSavedListingsStore = create<SavedListingsState>((set, get) => ({
  userId: null,
  ids: [],
  ready: false,

  hydrate: async (userId) => {
    if (!userId) {
      set({ userId: null, ids: [], ready: true });
      return;
    }

    const useServer = await canSyncSavedListingsToServer();
    if (!useServer) {
      const ids = await loadSavedListingIds(userId);
      set({ userId, ids, ready: true });
      return;
    }

    try {
      const localIds = await loadSavedListingIds(userId);
      let serverIds = await fetchSavedListingIdsFromServer();

      const missingOnServer = localIds.filter((id) => !serverIds.includes(id));
      if (missingOnServer.length > 0) {
        await Promise.all(missingOnServer.map((id) => addSavedListingOnServer(id).catch(() => undefined)));
        serverIds = await fetchSavedListingIdsFromServer();
        await clearSavedListingIds(userId);
      }

      set({ userId, ids: serverIds, ready: true });
    } catch {
      const ids = await loadSavedListingIds(userId);
      set({ userId, ids, ready: true });
    }
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) return;

    const useServer = await canSyncSavedListingsToServer();
    if (useServer) {
      try {
        const serverIds = await fetchSavedListingIdsFromServer();
        set({ ids: serverIds });
        return;
      } catch {
        // fall through to local
      }
    }

    const ids = await loadSavedListingIds(userId);
    set({ ids });
  },

  toggle: async (listingId) => {
    const { userId, ids } = get();
    if (!userId) return false;

    const saved = ids.includes(listingId);
    const next = saved ? ids.filter((id) => id !== listingId) : [...ids, listingId];
    set({ ids: next });

    const useServer = await canSyncSavedListingsToServer();
    try {
      if (useServer) {
        if (saved) {
          await removeSavedListingOnServer(listingId);
        } else {
          await addSavedListingOnServer(listingId);
        }
      } else {
        await saveSavedListingIds(userId, next);
      }
      return !saved;
    } catch {
      set({ ids });
      return saved;
    }
  },

  isSaved: (listingId) => get().ids.includes(listingId),
}));
