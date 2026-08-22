import { Timestamp } from 'firebase/firestore';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { generateCouponCode } from '@/lib/couponCode';
import { couponsRepository } from '@/features/data/applicationsRepository';
import { Coupon } from '@/types';
import { TradeListingRecord, TradeOfferRecord, TradeSwapResult } from './types';
import { t } from '@/i18n';

export type { TradeSwapResult };

function createSwappedCoupon(source: Coupon, newUserId: string): Coupon {
  const remainingUses = Math.max(1, source.totalUses - source.usedCount);

  return {
    id: demoStore.nextTradeId('c'),
    userId: newUserId,
    businessId: source.businessId,
    taskId: source.taskId,
    applicationId: `trade-swap-${Date.now()}`,
    rewardDescription: source.rewardDescription,
    totalUses: remainingUses,
    usedCount: 0,
    qrCode: `qr-trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    couponCode: generateCouponCode(),
    expiresAt: source.expiresAt,
    usageHistory: [],
    status: 'active',
    createdAt: Timestamp.now(),
  };
}

function invalidateCoupon(couponId: string): void {
  const coupon = demoStore.getCouponById(couponId);
  if (!coupon) return;

  demoStore.updateCoupon(couponId, {
    status: 'traded',
    usedCount: coupon.totalUses,
  });
}

/**
 * Takas onayında iki kupon imha edilir; taraflara yeni kodlarla kupon verilir.
 * Demo modda client-side; prod için Cloud Function gerekir.
 */
export async function executeTradeSwap(
  listing: TradeListingRecord,
  offer: TradeOfferRecord
): Promise<TradeSwapResult> {
  if (!offer.counterCouponId) {
    throw Object.assign(new Error(t('tradeCouponSwap.missingCounterCoupon')), { code: 'missing-counter-coupon' });
  }

  const listingCoupon = await couponsRepository.getById(listing.couponId);
  const offerCoupon = await couponsRepository.getById(offer.counterCouponId);

  if (!listingCoupon || listingCoupon.userId !== listing.ownerId) {
    throw Object.assign(new Error(t('tradeCouponSwap.invalidListingCoupon')), { code: 'invalid-listing-coupon' });
  }
  if (!offerCoupon || offerCoupon.userId !== offer.fromUserId) {
    throw Object.assign(new Error(t('tradeCouponSwap.invalidOfferCoupon')), { code: 'invalid-offer-coupon' });
  }
  if (listingCoupon.status !== 'active' && listingCoupon.status !== 'locked') {
    throw Object.assign(new Error(t('tradeCouponSwap.couponsMustBeActive')), {
      code: 'coupon-not-active',
    });
  }
  if (offerCoupon.status !== 'active' && offerCoupon.status !== 'locked') {
    throw Object.assign(new Error(t('tradeCouponSwap.couponsMustBeActive')), {
      code: 'coupon-not-active',
    });
  }

  if (!shouldUseDemoData()) {
    throw Object.assign(
      new Error(t('tradeCouponSwap.demoOrCloudOnly')),
      { code: 'swap-needs-function' }
    );
  }

  invalidateCoupon(listingCoupon.id);
  invalidateCoupon(offerCoupon.id);

  const offererNew = createSwappedCoupon(listingCoupon, offer.fromUserId);
  const ownerNew = createSwappedCoupon(offerCoupon, listing.ownerId);

  demoStore.addCoupon(offererNew);
  demoStore.addCoupon(ownerNew);

  return {
    ownerNewCouponId: ownerNew.id,
    offererNewCouponId: offererNew.id,
  };
}
