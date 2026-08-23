import { GeoPoint, Timestamp } from 'firebase/firestore';
import {
  Application,
  ApplicationMessage,
  Business,
  BexNotification,
  Coupon,
  CreateBusiness,
  CreateTask,
  Task,
} from '../types';
import { DEMO_APPLICATIONS, DEMO_BUSINESSES, DEMO_TASKS } from './demoData';
import type {
  TradeListingPrivateCoupon,
  TradeListingRecord,
  TradeOfferPrivateCoupon,
  TradeOfferRecord,
} from '../features/trade/types';

const loc = new GeoPoint(41.0082, 28.9784);

let tasks: Task[] = [...DEMO_TASKS];
let businesses: Business[] = [...DEMO_BUSINESSES];
let applications: Application[] = [...DEMO_APPLICATIONS];
let coupons: Coupon[] = [];
let notifications: BexNotification[] = [];
let messages: ApplicationMessage[] = [];
let tradeListings: TradeListingRecord[] = [];
let tradeListingSecrets: Record<string, TradeListingPrivateCoupon> = {};
let tradeOffers: TradeOfferRecord[] = [];
let tradeOfferSecrets: Record<string, TradeOfferPrivateCoupon> = {};
let tradeIdCounter = 100;

let idCounter = 100;

function nextId(prefix: string) {
  idCounter += 1;
  return `demo-${prefix}${idCounter}`;
}

export const demoStore = {
  getTasks: () => tasks,
  getBusinesses: () => businesses,
  getApplications: () => applications,
  getCoupons: () => coupons,
  getNotifications: () => notifications,

  getNotificationsByUser(userId: string): BexNotification[] {
    return notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },

  addNotification(notification: Omit<BexNotification, 'id' | 'createdAt' | 'read'>): BexNotification {
    const item: BexNotification = {
      id: nextId('n'),
      read: false,
      createdAt: Timestamp.now(),
      ...notification,
    };
    notifications = [item, ...notifications];
    return item;
  },

  markNotificationRead(id: string, userId: string): boolean {
    let updated = false;
    notifications = notifications.map((n) => {
      if (n.id !== id || n.userId !== userId) return n;
      updated = true;
      return { ...n, read: true };
    });
    return updated;
  },

  markAllNotificationsRead(userId: string) {
    notifications = notifications.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
  },

  getUnreadNotificationCount(userId: string): number {
    return notifications.filter((n) => n.userId === userId && !n.read).length;
  },

  getBusinessByOwner(ownerUid: string): Business | null {
    return businesses.find((b) => b.ownerUid === ownerUid) ?? null;
  },

  getBusinessById(id: string): Business | null {
    return businesses.find((b) => b.id === id) ?? null;
  },

  getTaskById(id: string): Task | null {
    return tasks.find((t) => t.id === id) ?? null;
  },

  /** Kullanıcılara görünen onaylı görevler */
  getVisibleTasks(): Task[] {
    return tasks
      .filter((t) => t.status === 'active' && t.approvedByAdmin)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },

  getFeaturedTasks(limit = 5): Task[] {
    const featured = tasks.filter(
      (t) => t.status === 'active' && t.approvedByAdmin && t.featured
    );
    if (featured.length > 0) {
      return featured.slice(0, limit);
    }
    return this.getVisibleTasks().slice(0, limit);
  },

  updateBusiness(id: string, patch: Partial<Business>): Business | null {
    let updated: Business | null = null;
    businesses = businesses.map((b) => {
      if (b.id !== id) return b;
      updated = { ...b, ...patch };
      return updated;
    });
    return updated;
  },

  createBusiness(ownerUid: string, data: CreateBusiness): Business {
    const business: Business = {
      id: nextId('b'),
      ...data,
      ownerUid,
      isVerified: false,
      verificationStatus: 'none',
      reputationScore: 0,
      totalTasksPublished: 0,
      createdAt: Timestamp.now(),
    };
    businesses = [business, ...businesses];
    return business;
  },

  createTask(businessId: string, data: CreateTask): Task {
    const task: Task = {
      id: nextId('t'),
      ...data,
      businessId,
      currentApplicantCount: 0,
      approvedByAdmin: false,
      createdAt: Timestamp.now(),
    };
    tasks = [task, ...tasks];
    businesses = businesses.map((b) =>
      b.id === businessId
        ? { ...b, totalTasksPublished: b.totalTasksPublished + 1 }
        : b
    );
    return task;
  },

  updateTask(id: string, patch: Partial<Task>): Task | null {
    let updated: Task | null = null;
    tasks = tasks.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...patch };
      return updated;
    });
    return updated;
  },

  getMessagesByApplication(applicationId: string): ApplicationMessage[] {
    return messages
      .filter((m) => m.applicationId === applicationId)
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  },

  addMessage(
    data: Omit<ApplicationMessage, 'id' | 'createdAt'>
  ): ApplicationMessage {
    const item: ApplicationMessage = {
      id: nextId('m'),
      createdAt: Timestamp.now(),
      ...data,
    };
    messages = [...messages, item];
    return item;
  },

  getTasksByBusiness(businessId: string): Task[] {
    return tasks.filter((t) => t.businessId === businessId);
  },

  getApplicationsByBusiness(businessId: string): Application[] {
    return applications
      .filter((a) => a.businessId === businessId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  },

  updateApplication(id: string, patch: Partial<Application>) {
    applications = applications.map((a) =>
      a.id === id ? { ...a, ...patch } : a
    );
  },

  addApplication(app: Application) {
    applications = [app, ...applications];
  },

  incrementTaskApplicantCount(taskId: string) {
    tasks = tasks.map((t) =>
      t.id === taskId
        ? { ...t, currentApplicantCount: t.currentApplicantCount + 1 }
        : t
    );
  },

  addCoupon(coupon: Coupon) {
    coupons = [coupon, ...coupons];
  },

  getCouponById(id: string): Coupon | null {
    return coupons.find((c) => c.id === id) ?? null;
  },

  updateCoupon(id: string, patch: Partial<Coupon>): Coupon | null {
    let updated: Coupon | null = null;
    coupons = coupons.map((c) => {
      if (c.id !== id) return c;
      updated = { ...c, ...patch };
      return updated;
    });
    return updated;
  },

  getCouponByCode(code: string): Coupon | null {
    return coupons.find((c) => c.couponCode === code) ?? null;
  },

  redeemCoupon(couponId: string, scannedBy: string): Coupon | null {
    const coupon = coupons.find((c) => c.id === couponId);
    if (!coupon || coupon.status !== 'active') return null;
    if (coupon.usedCount >= coupon.totalUses) return null;

    const usedCount = coupon.usedCount + 1;
    const status = usedCount >= coupon.totalUses ? 'exhausted' : 'active';

    const updated: Coupon = {
      ...coupon,
      usedCount,
      status,
      usageHistory: [
        ...coupon.usageHistory,
        { usedAt: Timestamp.now(), scannedBy },
      ],
    };

    coupons = coupons.map((c) => (c.id === couponId ? updated : c));
    return updated;
  },

  submitVerification(
    businessId: string,
    documentUrl: string,
    fileName: string
  ): Business {
    businesses = businesses.map((b) =>
      b.id === businessId
        ? {
            ...b,
            verificationStatus: 'pending',
            verificationDocumentUrl: documentUrl,
          }
        : b
    );
    const updated = businesses.find((b) => b.id === businessId);
    if (!updated) throw new Error('İşletme bulunamadı');
    return updated;
  },

  getCouponsByBusiness(businessId: string): Coupon[] {
    return coupons.filter((c) => c.businessId === businessId);
  },

  ensureSampleApplicationsForUser(userId: string) {
    if (applications.some((a) => a.userId === userId)) return;

    const samples: Application[] = [
      {
        id: `demo-a-sample1-${userId.slice(-6)}`,
        taskId: 'demo-t1',
        userId,
        businessId: 'demo-b1',
        status: 'pending',
        coverLetter:
          'Bu göreve uygun olduğumu düşünüyorum. Deneyimlerimi paylaşmaya hazırım.',
        portfolioUrl: '',
        submissionText: '',
        submissionFiles: [],
        createdAt: Timestamp.now(),
      },
      {
        id: `demo-a-sample2-${userId.slice(-6)}`,
        taskId: 'demo-t4',
        userId,
        businessId: 'demo-b1',
        status: 'approved',
        coverLetter: 'Logo ve marka kimliği projelerinde deneyimliyim.',
        portfolioUrl: 'https://behance.net',
        submissionText: '',
        submissionFiles: [],
        createdAt: Timestamp.fromMillis(Date.now() - 86400000 * 2),
      },
    ];
    applications = [...samples, ...applications];
  },

  ensureSampleCouponForUser(userId: string) {
    const activeForUser = coupons.filter((c) => c.userId === userId && c.status === 'active');

    if (activeForUser.length === 0) {
      coupons = [
        {
          id: `demo-c-barber-${userId.slice(-6)}`,
          userId,
          businessId: 'demo-b1',
          taskId: 'demo-t1',
          applicationId: 'demo-a1',
          rewardDescription: '3 ücretsiz saç tıraşı (kuaför)',
          totalUses: 3,
          usedCount: 0,
          qrCode: `qr-${userId}-barber`,
          couponCode: `PS-BRB-${userId.slice(-4)}`,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
          usageHistory: [],
          status: 'active',
          createdAt: Timestamp.now(),
        },
        ...coupons,
      ];
    }

    if (coupons.filter((c) => c.userId === userId && c.status === 'active').length < 2) {
      coupons = [
        {
          id: `demo-c-market-${userId.slice(-6)}`,
          userId,
          businessId: 'demo-b1',
          taskId: 'demo-t4',
          applicationId: 'demo-a2',
          rewardDescription: '2x market alışveriş kuponu',
          totalUses: 2,
          usedCount: 0,
          qrCode: `qr-${userId}-market`,
          couponCode: `PS-MKT-${userId.slice(-4)}`,
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
          usageHistory: [],
          status: 'active',
          createdAt: Timestamp.now(),
        },
        ...coupons,
      ];
    }
  },

  getPendingAdminTasks(): Task[] {
    return tasks.filter((t) => t.status === 'active' && !t.approvedByAdmin);
  },

  getPendingSubmissions(): Application[] {
    return applications
      .filter((a) => a.status === 'submitted')
      .sort((a, b) => (b.submittedAt?.toMillis() ?? 0) - (a.submittedAt?.toMillis() ?? 0));
  },

  setTaskAdminApproval(taskId: string, approved: boolean) {
    tasks = tasks.map((t) => {
      if (t.id !== taskId) return t;
      if (approved) {
        return { ...t, approvedByAdmin: true };
      }
      return { ...t, status: 'paused' as const, approvedByAdmin: false };
    });
  },

  getPendingVerifications(): Business[] {
    return businesses.filter((b) => b.verificationStatus === 'pending');
  },

  setBusinessVerification(
    businessId: string,
    status: 'verified' | 'rejected'
  ): Business | null {
    businesses = businesses.map((b) => {
      if (b.id !== businessId) return b;
      return {
        ...b,
        verificationStatus: status,
        isVerified: status === 'verified',
      };
    });
    return businesses.find((b) => b.id === businessId) ?? null;
  },

  getAnalytics(businessId: string) {
    const bizTasks = tasks.filter((t) => t.businessId === businessId);
    const bizApps = applications.filter((a) => a.businessId === businessId);
    const bizCoupons = coupons.filter((c) => c.businessId === businessId);

    const completed = bizApps.filter((a) => a.status === 'rewarded').length;
    const distributed = bizCoupons.length;
    const used = bizCoupons.reduce((sum, c) => sum + c.usedCount, 0);

    const categoryCount: Record<string, number> = {};
    for (const t of bizTasks) {
      categoryCount[t.category] = (categoryCount[t.category] ?? 0) + 1;
    }

    const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

    return {
      publishedTasks: bizTasks.length,
      activeTasks: bizTasks.filter((t) => t.status === 'active').length,
      pendingApproval: bizTasks.filter((t) => !t.approvedByAdmin).length,
      totalApplications: bizApps.length,
      pendingApplications: bizApps.filter((a) => a.status === 'pending').length,
      submittedApplications: bizApps.filter((a) => a.status === 'submitted').length,
      completedTasks: completed,
      couponsDistributed: distributed,
      couponsUsed: used,
      couponUseRate: distributed > 0 ? Math.round((used / distributed) * 100) : 0,
      topCategory: topCategory?.[0] ?? null,
      topCategoryCount: topCategory?.[1] ?? 0,
    };
  },

  defaultLocation: loc,

  nextTradeId(prefix: string) {
    tradeIdCounter += 1;
    return `demo-${prefix}${tradeIdCounter}`;
  },

  getTradeListings(): TradeListingRecord[] {
    return tradeListings;
  },

  setTradeListings(list: TradeListingRecord[]) {
    tradeListings = list;
  },

  getTradeListingSecret(listingId: string): TradeListingPrivateCoupon | undefined {
    return tradeListingSecrets[listingId];
  },

  setTradeListingSecret(listingId: string, secret: TradeListingPrivateCoupon) {
    tradeListingSecrets[listingId] = secret;
  },

  getTradeOffers(): TradeOfferRecord[] {
    return tradeOffers;
  },

  setTradeOffers(list: TradeOfferRecord[]) {
    tradeOffers = list;
  },

  getTradeOfferSecret(offerId: string): TradeOfferPrivateCoupon | undefined {
    return tradeOfferSecrets[offerId];
  },

  setTradeOfferSecret(offerId: string, secret: TradeOfferPrivateCoupon) {
    tradeOfferSecrets[offerId] = secret;
  },
};
