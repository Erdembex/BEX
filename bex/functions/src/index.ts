import { FieldValue, Timestamp, DocumentData } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { db, COLLECTIONS } from './lib/firestore';
import { pushNotification } from './lib/notifications';

export { onApplicationCreated, onApplicationUpdated } from './triggers/applications';
export { onTradeOfferCreated, onTradeOfferUpdated } from './triggers/tradeOffers';

function generateCouponCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PS-${part()}-${part()}`;
}

async function assertBusinessOwner(businessId: string, uid: string): Promise<void> {
  const bizSnap = await db.collection(COLLECTIONS.BUSINESSES).doc(businessId).get();
  if (!bizSnap.exists) {
    throw new HttpsError('not-found', 'İşletme bulunamadı.');
  }
  if (bizSnap.data()?.ownerUid !== uid) {
    throw new HttpsError('permission-denied', 'Bu işlem için yetkiniz yok.');
  }
}

/** İşletme başvuruyu onaylar — kupon oluşturulmaz. */
export const approveApplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const applicationId = request.data?.applicationId as string | undefined;
  const reviewNote = (request.data?.reviewNote as string | undefined) ?? '';

  if (!applicationId?.trim()) {
    throw new HttpsError('invalid-argument', 'applicationId gerekli.');
  }

  const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new HttpsError('not-found', 'Başvuru bulunamadı.');
  }

  const app = appSnap.data()!;
  if (app.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Bu başvuru onaylanamaz.');
  }

  await assertBusinessOwner(app.businessId, request.auth.uid);

  await appRef.update({
    status: 'approved',
    reviewNote,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

/** Teslim onaylandıktan sonra kupon üretir. */
export const issueCouponForSubmission = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const applicationId = request.data?.applicationId as string | undefined;
  const reviewNote = (request.data?.reviewNote as string | undefined) ?? '';

  if (!applicationId?.trim()) {
    throw new HttpsError('invalid-argument', 'applicationId gerekli.');
  }

  const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new HttpsError('not-found', 'Başvuru bulunamadı.');
  }

  const app = appSnap.data()!;
  if (app.status !== 'submission_approved') {
    throw new HttpsError('failed-precondition', 'Teslim onaylanamaz.');
  }

  await assertBusinessOwner(app.businessId, request.auth.uid);

  const taskSnap = await db.collection(COLLECTIONS.TASKS).doc(app.taskId).get();
  if (!taskSnap.exists) {
    throw new HttpsError('not-found', 'Görev bulunamadı.');
  }
  const task = taskSnap.data()!;

  const couponRef = db.collection(COLLECTIONS.COUPONS).doc();
  const userRef = db.collection(COLLECTIONS.USERS).doc(app.userId);
  const couponCode = generateCouponCode();
  const expiresAt = Timestamp.fromMillis(Date.now() + 90 * 86400000);

  await db.runTransaction(async (tx) => {
    const freshApp = await tx.get(appRef);
    if (!freshApp.exists) {
      throw new HttpsError('not-found', 'Başvuru bulunamadı.');
    }
    if (freshApp.data()!.status !== 'submission_approved') {
      throw new HttpsError('failed-precondition', 'Teslim zaten işlenmiş.');
    }

    tx.update(appRef, {
      status: 'rewarded',
      reviewNote,
      reviewedAt: FieldValue.serverTimestamp(),
    });

    tx.set(couponRef, {
      userId: app.userId,
      businessId: app.businessId,
      taskId: app.taskId,
      applicationId,
      rewardDescription: task.rewardDescription,
      totalUses: task.rewardQuantity ?? 1,
      usedCount: 0,
      qrCode: `qr-${Date.now()}`,
      couponCode,
      expiresAt,
      usageHistory: [],
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.update(userRef, {
      completedTaskCount: FieldValue.increment(1),
    });
  });

  await pushNotification({
    userId: app.userId as string,
    title: 'Tebrikler! Kuponun hazır',
    body: `Görev teslimin onaylandı. Kupon kodun: ${couponCode}`,
    type: 'coupon_issued',
    data: { applicationId, couponId: couponRef.id },
  });

  const couponSnap = await couponRef.get();
  return {
    coupon: { id: couponRef.id, ...couponSnap.data() },
  };
});

/** @deprecated issueCouponForSubmission kullan */
export const approveApplicationAndIssueCoupon = issueCouponForSubmission;

/** İşletme kupon kullanımını onaylar. */
export const redeemCoupon = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const couponId = request.data?.couponId as string | undefined;
  if (!couponId?.trim()) {
    throw new HttpsError('invalid-argument', 'couponId gerekli.');
  }

  const couponRef = db.collection(COLLECTIONS.COUPONS).doc(couponId);
  const couponSnap = await couponRef.get();
  if (!couponSnap.exists) {
    throw new HttpsError('not-found', 'Kupon bulunamadı.');
  }

  const coupon = couponSnap.data()!;
  await assertBusinessOwner(coupon.businessId, request.auth.uid);

  if (coupon.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Kupon aktif değil.');
  }
  if ((coupon.usedCount ?? 0) >= (coupon.totalUses ?? 1)) {
    throw new HttpsError('failed-precondition', 'Kupon tükenmiş.');
  }

  const expiresAt = coupon.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toMillis() < Date.now()) {
    throw new HttpsError('failed-precondition', 'Kuponun süresi dolmuş.');
  }

  const scannedBy = request.auth.uid;
  const usedCount = (coupon.usedCount ?? 0) + 1;
  const status = usedCount >= (coupon.totalUses ?? 1) ? 'exhausted' : 'active';
  const usageEntry = { usedAt: FieldValue.serverTimestamp(), scannedBy };

  await couponRef.update({
    usedCount,
    status,
    usageHistory: FieldValue.arrayUnion(usageEntry),
  });

  const remaining = (coupon.totalUses ?? 1) - usedCount;
  await pushNotification({
    userId: coupon.userId as string,
    title: 'Kupon kullanıldı',
    body:
      remaining > 0
        ? `Kuponun kullanıldı. Kalan hak: ${remaining}.`
        : 'Kuponun tamamen kullanıldı.',
    type: 'general',
    data: { couponId },
  });

  const updated = await couponRef.get();
  return {
    coupon: { id: couponRef.id, ...updated.data() },
  };
});

type CouponDoc = DocumentData;

type TradeOfferDoc = {
  listingId: string;
  listingTitle: string;
  fromUserId: string;
  counterCouponId: string;
  status: string;
};

type TradeListingDoc = {
  ownerId: string;
  couponId: string;
  status: string;
};

function buildSwappedCoupon(source: CouponDoc, newUserId: string): CouponDoc {
  const totalUses = source.totalUses ?? 1;
  const usedCount = source.usedCount ?? 0;
  const remainingUses = Math.max(1, totalUses - usedCount);

  return {
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
    createdAt: FieldValue.serverTimestamp(),
  };
}

/** Takas teklifi kabul — iki eski kupon imha, iki yeni kupon üretilir. */
export const executeTradeSwap = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const offerId = request.data?.offerId as string | undefined;
  if (!offerId?.trim()) {
    throw new HttpsError('invalid-argument', 'offerId gerekli.');
  }

  const ownerId = request.auth.uid;
  const offerRef = db.collection(COLLECTIONS.TRADE_OFFERS).doc(offerId);
  const offerSnap = await offerRef.get();
  if (!offerSnap.exists) {
    throw new HttpsError('not-found', 'Teklif bulunamadı.');
  }

  const offerData = offerSnap.data() as TradeOfferDoc;
  const listingRef = db.collection(COLLECTIONS.TRADE_LISTINGS).doc(offerData.listingId);
  const listingSnap = await listingRef.get();
  if (!listingSnap.exists) {
    throw new HttpsError('not-found', 'İlan bulunamadı.');
  }

  const listingData = listingSnap.data() as TradeListingDoc;
  if (listingData.ownerId !== ownerId) {
    throw new HttpsError('permission-denied', 'Bu teklifi yönetemezsin.');
  }
  if (offerData.status !== 'pending' || listingData.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Teklif artık beklemede değil.');
  }
  if (!offerData.counterCouponId) {
    throw new HttpsError('failed-precondition', 'Teklifte kupon seçilmemiş.');
  }

  const listingCouponRef = db.collection(COLLECTIONS.COUPONS).doc(listingData.couponId);
  const offerCouponRef = db.collection(COLLECTIONS.COUPONS).doc(offerData.counterCouponId);

  const otherOffersSnap = await db
    .collection(COLLECTIONS.TRADE_OFFERS)
    .where('listingId', '==', offerData.listingId)
    .where('status', '==', 'pending')
    .get();

  const ownerNewRef = db.collection(COLLECTIONS.COUPONS).doc();
  const offererNewRef = db.collection(COLLECTIONS.COUPONS).doc();
  const rejectedUserIds: string[] = [];

  await db.runTransaction(async (tx) => {
    const freshOffer = await tx.get(offerRef);
    const freshListing = await tx.get(listingRef);
    const listingCouponSnap = await tx.get(listingCouponRef);
    const offerCouponSnap = await tx.get(offerCouponRef);

    if (!freshOffer.exists || !freshListing.exists) {
      throw new HttpsError('not-found', 'Takas kaydı bulunamadı.');
    }

    const freshOfferData = freshOffer.data()!;
    const freshListingData = freshListing.data()!;

    if (freshListingData.ownerId !== ownerId) {
      throw new HttpsError('permission-denied', 'Bu teklifi yönetemezsin.');
    }
    if (freshOfferData.status !== 'pending' || freshListingData.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Teklif artık beklemede değil.');
    }
    if (!listingCouponSnap.exists || !offerCouponSnap.exists) {
      throw new HttpsError('not-found', 'Kupon bulunamadı.');
    }

    const listingCoupon = listingCouponSnap.data()!;
    const offerCoupon = offerCouponSnap.data()!;

    if (listingCoupon.userId !== ownerId || listingCoupon.status !== 'active') {
      throw new HttpsError('failed-precondition', 'İlan kuponu geçersiz.');
    }
    if (offerCoupon.userId !== freshOfferData.fromUserId || offerCoupon.status !== 'active') {
      throw new HttpsError('failed-precondition', 'Teklif kuponu geçersiz.');
    }

    for (const doc of otherOffersSnap.docs) {
      if (doc.id === offerId) continue;
      const pendingSnap = await tx.get(doc.ref);
      if (pendingSnap.exists && pendingSnap.data()!.status === 'pending') {
        tx.update(doc.ref, { status: 'rejected' });
        rejectedUserIds.push(pendingSnap.data()!.fromUserId as string);
      }
    }

    tx.update(offerRef, { status: 'accepted' });
    tx.update(listingRef, {
      status: 'completed',
      acceptedOfferId: offerId,
      acceptedFromUserId: freshOfferData.fromUserId,
      tradeCompletedAt: FieldValue.serverTimestamp(),
    });

    tx.update(listingCouponRef, {
      status: 'traded',
      usedCount: listingCoupon.totalUses ?? 1,
    });
    tx.update(offerCouponRef, {
      status: 'traded',
      usedCount: offerCoupon.totalUses ?? 1,
    });

    tx.set(ownerNewRef, buildSwappedCoupon(offerCoupon, ownerId));
    tx.set(offererNewRef, buildSwappedCoupon(listingCoupon, freshOfferData.fromUserId as string));
  });

  const listingTitle = offerData.listingTitle ?? 'Takas ilanı';
  const notifyData = {
    listingId: offerData.listingId,
    offerId,
    tradeTab: 'offers',
  };

  await pushNotification({
    userId: offerData.fromUserId,
    title: 'Teklifin kabul edildi',
    body: `"${listingTitle}" takası onaylandı. Eski kodun iptal edildi — yeni kuponun Kuponlarım sekmesinde.`,
    type: 'trade_offer_accepted',
    data: notifyData,
  });

  await Promise.all(
    rejectedUserIds.map((userId) =>
      pushNotification({
        userId,
        title: 'Teklif güncellendi',
        body: `"${listingTitle}" ilanında başka bir teklif kabul edildi.`,
        type: 'trade_offer_rejected',
        data: notifyData,
      })
    )
  );

  return {
    ownerNewCouponId: ownerNewRef.id,
    offererNewCouponId: offererNewRef.id,
  };
});
