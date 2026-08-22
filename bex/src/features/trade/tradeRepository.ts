import { Timestamp } from 'firebase/firestore';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { formatRelativeTime } from '@/lib/dateUtils';
import { couponsRepository } from '@/features/data/applicationsRepository';
import { usersRepository } from '@/features/data/usersRepository';
import {
  notifyTradeOfferAccepted,
  notifyTradeOfferReceived,
  notifyTradeOfferRejected,
} from './tradeNotifications';
import { executeTradeSwap } from './tradeCouponSwap';
import {
  acceptSwapOffer,
  cancelSwapListing,
  createSwapListing,
  fetchMySwapListings,
  fetchMySwapOffers,
  fetchSwapEligibleCoupons,
  fetchSwapListings,
  fetchSwapOffersForListing,
  isBackendCouponId,
  rejectSwapOffer,
  sendSwapOffer,
  useSwapRestBackend,
} from './swapListingsApi';
import {
  CreateTradeListingInput,
  CreateTradeOfferInput,
  TradeListing,
  TradeListingPrivateCoupon,
  TradeListingRecord,
  TradeOffer,
  TradeOfferRecord,
  TradeSwapResult,
  TradeHistoryEntry,
} from './types';
import { Coupon } from '@/types';
import { t, getLocale } from '@/i18n';

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return (trimmed[0] ?? '?').toUpperCase();
}

function lockCouponForTrade(couponId: string): void {
  demoStore.updateCoupon(couponId, { status: 'locked' });
}

function unlockCouponFromTrade(couponId: string): void {
  const coupon = demoStore.getCouponById(couponId);
  if (coupon?.status === 'locked') {
    demoStore.updateCoupon(couponId, { status: 'active' });
  }
}

function toPublicOffer(record: TradeOfferRecord): TradeOffer {
  return {
    id: record.id,
    listingId: record.listingId,
    listingTitle: record.listingTitle,
    fromUserId: record.fromUserId,
    fromUserName: record.fromUserName,
    counterCouponId: record.counterCouponId,
    counterRewardLabel: record.counterRewardLabel ?? t('tradeRepository.defaultReward'),
    message: record.message ?? '',
    counterListingId: record.counterListingId,
    status: record.status,
    createdAtLabel: formatRelativeTime(record.createdAt) || t('tradeRepository.justNow'),
  };
}

function getLockedCouponIds(userId: string): Set<string> {
  const locked = new Set<string>();

  for (const listing of demoStore.getTradeListings()) {
    if (listing.ownerId === userId && listing.status === 'active') {
      locked.add(listing.couponId);
    }
  }

  for (const offer of demoStore.getTradeOffers()) {
    if (offer.fromUserId === userId && offer.status === 'pending' && offer.counterCouponId) {
      locked.add(offer.counterCouponId);
    }
  }

  return locked;
}

async function getLockedCouponIdsForUser(userId: string): Promise<Set<string>> {
  if (shouldUseDemoData()) {
    return getLockedCouponIds(userId);
  }

  if (await useSwapRestBackend()) {
    const locked = new Set<string>();
    try {
      const [listings, offers] = await Promise.all([
        fetchMySwapListings(),
        fetchMySwapOffers(),
      ]);
      for (const listing of listings) {
        if (listing.status === 'active' && listing.couponId) {
          locked.add(listing.couponId);
        }
      }
      for (const offer of offers) {
        if (offer.status === 'pending' && offer.counterCouponId) {
          locked.add(offer.counterCouponId);
        }
      }
    } catch {
      // sessiz
    }
    return locked;
  }

  return new Set<string>();
}

async function validateTradeCoupon(
  userId: string,
  couponId: string,
  locked: Set<string>
): Promise<Coupon> {
  const coupon = await couponsRepository.getById(couponId);
  if (!coupon || coupon.userId !== userId || coupon.status !== 'active') {
    throw Object.assign(new Error(t('tradeRepository.invalidCoupon')), {
      code: 'invalid-coupon',
    });
  }
  if (locked.has(couponId)) {
    throw Object.assign(new Error(t('tradeRepository.couponLocked')), {
      code: 'coupon-locked',
    });
  }
  return coupon;
}

function ensureDemoMarketSeed() {
  if (!shouldUseDemoData() || demoStore.getTradeListings().length > 0) return;

  const seeds: Omit<TradeListingRecord, 'id'>[] = [
    {
      ownerId: 'demo-trade-owner-1',
      ownerName: 'Elif K.',
      ownerAvatarInitial: 'E',
      title: t('tradeRepository.sampleTitle1'),
      description: t('tradeRepository.sampleDescription1'),
      suggestedTrade: t('tradeRepository.sampleSuggestedTrade1'),
      rewardLabel: t('tradeRepository.sampleReward1'),
      couponId: 'coupon-demo-seed-1',
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.fromMillis(Date.now() - 2 * 86400000),
    },
    {
      ownerId: 'demo-trade-owner-2',
      ownerName: 'Mert A.',
      ownerAvatarInitial: 'M',
      title: t('tradeRepository.sampleTitle2'),
      description: t('tradeRepository.sampleDescription2'),
      suggestedTrade: t('tradeRepository.sampleSuggestedTrade2'),
      rewardLabel: t('tradeRepository.sampleReward2'),
      couponId: 'coupon-demo-seed-2',
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.fromMillis(Date.now() - 5 * 86400000),
    },
  ];

  demoStore.setTradeListings(
    seeds.map((seed, index) => ({
      id: `demo-seed-tl-${index + 1}`,
      ...seed,
    }))
  );
}

function toPublicListing(record: TradeListingRecord): TradeListing {
  return {
    id: record.id,
    ownerId: record.ownerId,
    ownerName: record.ownerName,
    ownerAvatarInitial: record.ownerAvatarInitial,
    title: record.title,
    description: record.description,
    suggestedTrade: record.suggestedTrade,
    rewardLabel: record.rewardLabel,
    couponId: record.couponId,
    status: record.status,
    offerCount: record.offerCount,
    createdAtLabel: formatRelativeTime(record.createdAt) || t('tradeRepository.justNow'),
  };
}

function mergeTradeListings(primary: TradeListing[], secondary: TradeListing[]): TradeListing[] {
  const seen = new Set(primary.map((listing) => listing.id));
  return [...primary, ...secondary.filter((listing) => !seen.has(listing.id))];
}

async function getLegacyMyListings(ownerId: string): Promise<TradeListing[]> {
  if (shouldUseDemoData()) {
    return demoStore
      .getTradeListings()
      .filter((listing) => listing.ownerId === ownerId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .map(toPublicListing);
  }
  return [];
}

export const tradeRepository = {
  /** Takasa uygun aktif kuponlar (kilitli olanlar hariç) */
  async getAvailableTradeCoupons(userId: string): Promise<Coupon[]> {
    if (await useSwapRestBackend()) {
      try {
        const restCoupons = await fetchSwapEligibleCoupons();
        if (restCoupons.length > 0) {
          const locked = await getLockedCouponIdsForUser(userId);
          return restCoupons.filter((coupon) => !locked.has(coupon.id));
        }
      } catch {
        // Backend kupon yoksa veya hata varsa yerel/demo yedeğine düş
      }
    }

    if (shouldUseDemoData()) {
      demoStore.ensureSampleCouponForUser(userId);
    }

    const locked = await getLockedCouponIdsForUser(userId);
    const active = await couponsRepository.getActiveByUser(userId);
    return active.filter((coupon) => !locked.has(coupon.id));
  },

  /** Aktif ilanları getirir — couponCode asla dönmez */
  async getActiveListings(): Promise<TradeListing[]> {
    if (shouldUseDemoData()) {
      ensureDemoMarketSeed();
      return demoStore.getTradeListings()
        .filter((listing) => listing.status === 'active')
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicListing);
    }
    return [];
  },

  async getMarketListings(): Promise<TradeListing[]> {
    const legacy = await this.getActiveListings();

    if (!(await useSwapRestBackend())) {
      return legacy;
    }

    try {
      const rest = await fetchSwapListings();
      return mergeTradeListings(rest, legacy);
    } catch {
      return legacy;
    }
  },

  async getMyListings(ownerId: string): Promise<TradeListing[]> {
    const legacy = await getLegacyMyListings(ownerId);

    if (!(await useSwapRestBackend())) {
      return legacy;
    }

    try {
      const rest = await fetchMySwapListings();
      return mergeTradeListings(rest, legacy);
    } catch {
      return legacy;
    }
  },

  async cancelListing(ownerId: string, listingId: string): Promise<void> {
    if (await useSwapRestBackend()) {
      await cancelSwapListing(listingId);
      return;
    }

    if (shouldUseDemoData()) {
      const listing = demoStore.getTradeListings().find((item) => item.id === listingId);
      if (listing) {
        unlockCouponFromTrade(listing.couponId);
        demoStore.getTradeOffers()
          .filter((offer) => offer.listingId === listingId && offer.status === 'pending')
          .forEach((offer) => {
            if (offer.counterCouponId) unlockCouponFromTrade(offer.counterCouponId);
          });
      }
      demoStore.setTradeListings(
        demoStore.getTradeListings().filter((item) => item.id !== listingId)
      );
      return;
    }

    throw new Error(t('tradeRepository.listingCancelFailed'));
  },

  /** Tek ilan — couponCode asla dönmez */
  async getListingById(listingId: string): Promise<TradeListing | null> {
    if (shouldUseDemoData()) {
      const record = demoStore.getTradeListings().find((listing) => listing.id === listingId);
      return record ? toPublicListing(record) : null;
    }

    if (await useSwapRestBackend()) {
      try {
        const mine = await fetchMySwapListings();
        const own = mine.find((listing) => listing.id === listingId);
        if (own) return own;
        const market = await fetchSwapListings();
        return market.find((listing) => listing.id === listingId) ?? null;
      } catch {
        return null;
      }
    }

    return null;
  },

  /**
   * İlan oluşturur; kupon kodu private alt belgeye yazılır.
   * Ana ilan belgesinde couponCode tutulmaz.
   */
  async createListing(ownerId: string, input: CreateTradeListingInput): Promise<string> {
    if ((await useSwapRestBackend()) && isBackendCouponId(input.couponId)) {
      return createSwapListing(input);
    }

    const locked = await getLockedCouponIdsForUser(ownerId);
    const coupon = await validateTradeCoupon(ownerId, input.couponId, locked);

    const ownerName = await usersRepository.getDisplayName(ownerId);
    const record: Omit<TradeListingRecord, 'id'> = {
      ownerId,
      ownerName,
      ownerAvatarInitial: avatarInitial(ownerName),
      title: input.title.trim(),
      description: input.description.trim(),
      suggestedTrade: input.suggestedTrade.trim(),
      rewardLabel: input.rewardLabel.trim(),
      couponId: input.couponId,
      status: 'active',
      offerCount: 0,
      createdAt: Timestamp.now(),
    };

    const privateCoupon: TradeListingPrivateCoupon = {
      couponCode: coupon.couponCode,
      ownerId,
    };

    if (shouldUseDemoData()) {
      const id = demoStore.nextTradeId('tl');
      demoStore.setTradeListings([{ id, ...record }, ...demoStore.getTradeListings()]);
      demoStore.setTradeListingSecret(id, privateCoupon);
      lockCouponForTrade(input.couponId);
      return id;
    }

    if (await useSwapRestBackend()) {
      throw new Error(t('tradeRepository.backendOnlyListing'));
    }

    throw new Error(t('tradeRepository.listingNotSupportedInRest'));
  },

  /**
   * Takas teklifi — teklif eden kendi kuponunu seçmek zorunda.
   */
  async submitOffer(
    fromUserId: string,
    listingId: string,
    input: CreateTradeOfferInput
  ): Promise<string> {
    if (!input.counterCouponId?.trim()) {
      throw Object.assign(new Error(t('tradeRepository.mustSelectCouponToJoin')), {
        code: 'missing-counter-coupon',
      });
    }

    if ((await useSwapRestBackend()) && isBackendCouponId(input.counterCouponId)) {
      return sendSwapOffer(listingId, input.counterCouponId, input.message);
    }

    if (await useSwapRestBackend()) {
      throw Object.assign(
        new Error(t('tradeRepository.mustSelectValidWalletCoupon')),
        { code: 'invalid-coupon' }
      );
    }

    const listing = await this.getListingById(listingId);
    if (!listing || listing.status !== 'active') {
      throw Object.assign(new Error(t('tradeRepository.listingNotFoundOrInactive')), {
        code: 'listing-unavailable',
      });
    }
    if (listing.ownerId === fromUserId) {
      throw Object.assign(new Error(t('tradeRepository.cannotOfferOwnListing')), {
        code: 'self-offer',
      });
    }
    if (listing.couponId === input.counterCouponId) {
      throw Object.assign(new Error(t('tradeRepository.cannotSwapSameCoupon')), {
        code: 'same-coupon',
      });
    }

    const locked = await getLockedCouponIdsForUser(fromUserId);
    const counterCoupon = await validateTradeCoupon(
      fromUserId,
      input.counterCouponId,
      locked
    );

    const fromUserName = await usersRepository.getDisplayName(fromUserId);
    const message = (input.message ?? '').trim();

    const offerBase: Omit<TradeOfferRecord, 'id'> = {
      listingId,
      listingTitle: listing.title,
      fromUserId,
      fromUserName,
      counterCouponId: counterCoupon.id,
      counterRewardLabel: counterCoupon.rewardDescription,
      message,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    if (shouldUseDemoData()) {
      const id = demoStore.nextTradeId('to');
      demoStore.setTradeOffers([{ id, ...offerBase }, ...demoStore.getTradeOffers()]);
      lockCouponForTrade(counterCoupon.id);
      demoStore.setTradeListings(
        demoStore.getTradeListings().map((item) =>
          item.id === listingId ? { ...item, offerCount: item.offerCount + 1 } : item
        )
      );

      await notifyTradeOfferReceived({
        ownerId: listing.ownerId,
        fromUserName,
        listingTitle: listing.title,
        listingId,
        offerId: id,
      });

      return id;
    }

    throw Object.assign(
      new Error(t('tradeRepository.offerSubmitFailed')),
      { code: 'offer-failed' }
    );
  },

  /**
   * Kupon kodunu yalnızca yetkili durumlarda okur (demo + Firestore).
   * UI bağlantısı sonraki aşamada yapılacak.
   */
  async getListingCouponCode(
    listingId: string,
    requesterId: string
  ): Promise<string | null> {
    if (shouldUseDemoData()) {
      const listing = demoStore.getTradeListings().find((item) => item.id === listingId);
      if (!listing) return null;

      const secret = demoStore.getTradeListingSecret(listingId);
      if (!secret) return null;

      const revealed =
        listing.ownerId === requesterId ||
        (listing.status === 'completed' && listing.acceptedFromUserId === requesterId);

      return revealed ? secret.couponCode : null;
    }

    return null;
  },

  /** İlan sahibinin gelen teklifleri — couponCode dönmez */
  async getOffersForListing(listingId: string, ownerId: string): Promise<TradeOffer[]> {
    if (shouldUseDemoData()) {
      const listing = demoStore.getTradeListings().find((item) => item.id === listingId);
      if (!listing || listing.ownerId !== ownerId) return [];

      return demoStore.getTradeOffers()
        .filter((offer) => offer.listingId === listingId)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicOffer);
    }

    if (await useSwapRestBackend()) {
      try {
        const listing = await this.getListingById(listingId);
        return await fetchSwapOffersForListing(listingId, listing?.title ?? t('tradeRepository.defaultListingTitle'));
      } catch {
        return [];
      }
    }

    return [];
  },

  /** Kullanıcının gönderdiği teklifler — couponCode dönmez */
  async getMyOffers(fromUserId: string): Promise<TradeOffer[]> {
    if (shouldUseDemoData()) {
      return demoStore.getTradeOffers()
        .filter((offer) => offer.fromUserId === fromUserId)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
        .map(toPublicOffer);
    }

    if (await useSwapRestBackend()) {
      try {
        return await fetchMySwapOffers();
      } catch {
        return [];
      }
    }

    return [];
  },

  async getOfferCouponCode(offerId: string, requesterId: string): Promise<string | null> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) return null;

      const listing = demoStore.getTradeListings().find((item) => item.id === offer.listingId);
      const secret = demoStore.getTradeOfferSecret(offerId);
      if (!secret) return null;

      const revealed =
        offer.fromUserId === requesterId ||
        (offer.status === 'accepted' && listing?.ownerId === requesterId);

      return revealed ? secret.couponCode : null;
    }

    return null;
  },

  async rejectOffer(ownerId: string, offerId: string): Promise<void> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) {
        throw Object.assign(new Error(t('tradeRepository.offerNotFound')), { code: 'offer-not-found' });
      }
      const listing = demoStore.getTradeListings().find((item) => item.id === offer.listingId);
      if (!listing || listing.ownerId !== ownerId) {
        throw Object.assign(new Error(t('tradeRepository.cannotManageOffer')), { code: 'forbidden' });
      }
      if (offer.status !== 'pending') {
        throw Object.assign(new Error(t('tradeRepository.offerNoLongerPending')), { code: 'offer-closed' });
      }

      demoStore.setTradeOffers(
        demoStore.getTradeOffers().map((item) =>
          item.id === offerId ? { ...item, status: 'rejected' } : item
        )
      );
      if (offer.counterCouponId) unlockCouponFromTrade(offer.counterCouponId);

      await notifyTradeOfferRejected({
        fromUserId: offer.fromUserId,
        listingTitle: offer.listingTitle,
        listingId: offer.listingId,
        offerId: offer.id,
        reason: 'declined',
      });

      return;
    }

    if (await useSwapRestBackend()) {
      const listing = await this.findListingForOffer(offerId, ownerId);
      if (!listing) {
        throw Object.assign(new Error(t('tradeRepository.offerNotFound')), { code: 'offer-not-found' });
      }
      await rejectSwapOffer(listing.id, offerId);
      return;
    }

    throw Object.assign(new Error(t('tradeRepository.offerRejectFailed')), { code: 'offer-failed' });
  },
  async findListingForOffer(offerId: string, ownerId: string): Promise<TradeListing | null> {
    const myListings = await this.getMyListings(ownerId);
    for (const listing of myListings) {
      try {
        const offers = await fetchSwapOffersForListing(listing.id, listing.title);
        if (offers.some((offer) => offer.id === offerId)) return listing;
      } catch {
        // yoksay
      }
    }
    return null;
  },

  async acceptOffer(ownerId: string, offerId: string): Promise<TradeSwapResult> {
    if (shouldUseDemoData()) {
      const offer = demoStore.getTradeOffers().find((item) => item.id === offerId);
      if (!offer) {
        throw Object.assign(new Error(t('tradeRepository.offerNotFound')), { code: 'offer-not-found' });
      }

      const listingIndex = demoStore.getTradeListings().findIndex(
        (item) => item.id === offer.listingId
      );
      if (listingIndex < 0) {
        throw Object.assign(new Error(t('tradeRepository.listingNotFound')), { code: 'listing-not-found' });
      }

      const listing = demoStore.getTradeListings()[listingIndex];
      if (listing.ownerId !== ownerId) {
        throw Object.assign(new Error(t('tradeRepository.cannotManageOffer')), { code: 'forbidden' });
      }
      if (offer.status !== 'pending' || listing.status !== 'active') {
        throw Object.assign(new Error(t('tradeRepository.offerNoLongerPending')), { code: 'offer-closed' });
      }

      const autoRejected = demoStore.getTradeOffers().filter(
        (item) =>
          item.listingId === listing.id && item.id !== offerId && item.status === 'pending'
      );

      const swapResult = await executeTradeSwap(listing, offer);

      demoStore.setTradeOffers(
        demoStore.getTradeOffers().map((item) => {
          if (item.listingId !== listing.id) return item;
          if (item.id === offerId) return { ...item, status: 'accepted' };
          if (item.status === 'pending') {
            if (item.counterCouponId) unlockCouponFromTrade(item.counterCouponId);
            return { ...item, status: 'rejected' };
          }
          return item;
        })
      );

      demoStore.setTradeListings(
        demoStore.getTradeListings().map((item, index) =>
          index === listingIndex
            ? {
                ...item,
                status: 'completed',
                acceptedOfferId: offerId,
                acceptedFromUserId: offer.fromUserId,
                tradeCompletedAt: Timestamp.now(),
              }
            : item
        )
      );

      await notifyTradeOfferAccepted({
        fromUserId: offer.fromUserId,
        listingTitle: offer.listingTitle,
        listingId: offer.listingId,
        offerId: offer.id,
      });

      await Promise.all(
        autoRejected.map((rejected) =>
          notifyTradeOfferRejected({
            fromUserId: rejected.fromUserId,
            listingTitle: rejected.listingTitle,
            listingId: rejected.listingId,
            offerId: rejected.id,
            reason: 'other_accepted',
          })
        )
      );

      return swapResult;
    }

    if (await useSwapRestBackend()) {
      const listing = await this.findListingForOffer(offerId, ownerId);
      if (!listing) {
        throw Object.assign(new Error(t('tradeRepository.offerNotFound')), { code: 'offer-not-found' });
      }
      await acceptSwapOffer(listing.id, offerId);
      // Backend takası tamamlar ve yeni kuponları oluşturur; kodları burada dönmüyoruz.
      return { ownerNewCouponId: '', offererNewCouponId: '' };
    }

    throw Object.assign(new Error(t('tradeRepository.offerAcceptFailed')), { code: 'offer-failed' });
  },
  async getTradeHistory(userId: string): Promise<TradeHistoryEntry[]> {
    if (await useSwapRestBackend()) {
      try {
        const { fetchMySwapTrades } = await import('./swapListingsApi');
        const trades = await fetchMySwapTrades();
        const completed: TradeHistoryEntry[] = trades.map((trade) => ({
          id: `trade-${trade.id}`,
          kind: 'listing' as const,
          title: t('tradeRepository.tradeCompletedTitle'),
          subtitle: t('tradeRepository.tradeCompletedSubtitle'),
          detail: t('tradeRepository.tradeCompletedDetail'),
          status: 'completed' as const,
          createdAtLabel: trade.completedAt
            ? new Date(trade.completedAt).toLocaleDateString(getLocale() === 'en' ? 'en-US' : 'tr-TR', {
                day: 'numeric',
                month: 'short',
              })
            : t('tradeRepository.justNow'),
          referenceId: String(trade.swapListingId ?? trade.id),
        }));

        const [offers, listings] = await Promise.all([
          this.getMyOffers(userId),
          this.getMyListings(userId),
        ]);

        const pendingOffers: TradeHistoryEntry[] = offers
          .filter((offer) => offer.status === 'rejected')
          .map((offer) => ({
            id: `offer-${offer.id}`,
            kind: 'offer' as const,
            title: offer.listingTitle,
            subtitle: t('tradeRepository.offerSubtitle', { reward: offer.counterRewardLabel }),
            detail: t('tradeRepository.offerRejectedDetail'),
            status: 'rejected' as const,
            createdAtLabel: offer.createdAtLabel,
            referenceId: offer.id,
          }));

        return [...completed, ...pendingOffers].sort((a, b) =>
          a.createdAtLabel.localeCompare(b.createdAtLabel)
        );
      } catch {
        // aşağıdaki genel yola düş
      }
    }

    const [offers, listings] = await Promise.all([
      this.getMyOffers(userId),
      this.getMyListings(userId),
    ]);

    const offerHistory: TradeHistoryEntry[] = offers
      .filter((offer) => offer.status !== 'pending')
      .map((offer) => ({
        id: `offer-${offer.id}`,
        kind: 'offer' as const,
        title: offer.listingTitle,
        subtitle: t('tradeRepository.offerSubtitle', { reward: offer.counterRewardLabel }),
        detail:
          offer.status === 'accepted'
            ? t('tradeRepository.tradeCompletedHistory')
            : offer.status === 'rejected'
              ? t('tradeRepository.offerRejectedDetail')
              : t('tradeRepository.offerCancelledDetail'),
        status:
          offer.status === 'accepted'
            ? 'accepted'
            : offer.status === 'rejected'
              ? 'rejected'
              : 'cancelled',
        createdAtLabel: offer.createdAtLabel,
        referenceId: offer.id,
      }));

    const listingHistory: TradeHistoryEntry[] = listings
      .filter((listing) => listing.status === 'completed')
      .map((listing) => ({
        id: `listing-${listing.id}`,
        kind: 'listing' as const,
        title: listing.title,
        subtitle: t('tradeRepository.listingSubtitle', { reward: listing.rewardLabel }),
        detail: t('tradeRepository.listingCompletedDetail'),
        status: 'completed' as const,
        createdAtLabel: listing.createdAtLabel,
        referenceId: listing.id,
      }));

    return [...offerHistory, ...listingHistory];
  },
};
