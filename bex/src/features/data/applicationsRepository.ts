import { Timestamp } from 'firebase/firestore';
import { shouldUseDemoData } from '../../lib/devMode';
import { demoStore } from '../../lib/demoStore';
import {
  COLLECTIONS,
  Application,
  ApplicationStatus,
  CreateApplication,
  Coupon,
  Task,
} from '../../types';
import { tasksRepository } from './businessesRepository';
import { usersRepository } from './usersRepository';
import { notifyUser, notifyAdmins } from '../notifications/notificationsRepository';
import { refreshPendingFeedbackGate } from '@/components/feedback/PendingFeedbackGate';
import { generateCouponCode, formatCouponCodeFromId } from '@/lib/couponCode';
import {
  acceptApplication,
  applyToListing,
  fetchApplicationById,
  fetchBusinessApplications,
  fetchMyApplications,
  findMyApplicationForListing,
  rejectApplication,
  reviewApplication,
  submitApplicationSubmission,
  useApplicationsRestBackend,
  withdrawApplication,
  isCurrentApplicationOwner,
} from '../application/applicationsApi';
import { isBackendId } from '@/lib/api/backendId';
import { fetchIssuedCoupons, type BusinessIssuedCoupon } from '@/features/coupon/businessCouponsApi';
import {
  fetchCouponByApplicationId,
  fetchRestCouponById,
  fetchRestCoupons,
} from '@/features/coupon/couponsApi';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';

export const applicationsRepository = {
  async getById(id: string): Promise<Application | null> {
    if (isBackendId(id) && (await useApplicationsRestBackend())) {
      try {
        const app = await fetchApplicationById(id);
        if (app) return app;
      } catch {
        return null;
      }
    }

    if (shouldUseDemoData()) {
      return demoStore.getApplications().find((a) => a.id === id) ?? null;
    }
    return null;
  },

  async getByUser(userId: string, status?: ApplicationStatus): Promise<Application[]> {
    if (await useApplicationsRestBackend()) {
      try {
        let apps = await fetchMyApplications(userId);
        if (status) apps = apps.filter((app) => app.status === status);
        return apps;
      } catch {
        return [];
      }
    }

    if (shouldUseDemoData()) {
      let apps = demoStore.getApplications().filter((a) => a.userId === userId);
      if (status) apps = apps.filter((a) => a.status === status);
      return apps.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }
    return [];
  },

  async getActiveByUser(userId: string): Promise<Application[]> {
    if (await useApplicationsRestBackend()) {
      try {
        const apps = await fetchMyApplications(userId);
        return apps.filter((app) =>
          ['pending', 'approved', 'submitted', 'submission_approved'].includes(app.status)
        );
      } catch {
        // yerel yedeğe düş
      }
    }

    if (shouldUseDemoData()) {
      return demoStore
        .getApplications()
        .filter(
          (a) =>
            a.userId === userId &&
            ['pending', 'approved', 'submitted', 'submission_approved'].includes(a.status)
        );
    }
    return [];
  },

  async getByUserAndTask(userId: string, taskId: string): Promise<Application | null> {
    if (await useApplicationsRestBackend() && isBackendId(taskId)) {
      try {
        return await findMyApplicationForListing(userId, taskId);
      } catch {
        return null;
      }
    }

    const inactive: ApplicationStatus[] = ['rejected', 'cancelled'];
    if (shouldUseDemoData()) {
      return (
        demoStore
          .getApplications()
          .find(
            (a) =>
              a.userId === userId &&
              a.taskId === taskId &&
              !inactive.includes(a.status)
          ) ?? null
      );
    }
    return null;
  },

  async getByBusiness(businessId: string): Promise<Application[]> {
    if (await useApplicationsRestBackend()) {
      try {
        return await fetchBusinessApplications();
      } catch {
        return [];
      }
    }

    if (shouldUseDemoData()) {
      return demoStore.getApplicationsByBusiness(businessId);
    }
    return [];
  },

  async create(userId: string, data: CreateApplication): Promise<string> {
    const existing = await this.getByUserAndTask(userId, data.taskId);
    if (existing) {
      throw Object.assign(new Error('Bu göreve zaten başvurdun.'), { code: 'already-applied' });
    }

    if (await useApplicationsRestBackend() && isBackendId(data.taskId)) {
      return applyToListing(data);
    }

    if (shouldUseDemoData()) {
      const id = `demo-a${Date.now()}`;
      const app: Application = {
        id,
        ...data,
        userId,
        status: 'pending',
        submissionText: '',
        submissionFiles: [],
        createdAt: Timestamp.now(),
      };
      demoStore.addApplication(app);
      demoStore.incrementTaskApplicantCount(data.taskId);

      const business = demoStore.getBusinessById(data.businessId);
      if (business?.ownerUid) {
        await notifyUser({
          userId: business.ownerUid,
          title: 'Yeni başvuru',
          body: 'Görevine yeni bir başvuru geldi. İncelemen bekleniyor.',
          type: 'general',
          data: { applicationId: id, taskId: data.taskId },
          showLocalForUserId: business.ownerUid,
        });
      }

      return id;
    }
    throw new Error('Başvuru için REST oturumu gerekli.');
  },

  async submit(
    id: string,
    submissionText: string,
    submissionFiles: string[],
    submissionAttachments: string[] = [],
    submissionLinks: string[] = []
  ) {
    if (shouldUseDemoData()) {
      demoStore.updateApplication(id, {
        status: 'submitted',
        submissionText,
        submissionFiles,
        submissionAttachments,
        submissionLinks,
        submittedAt: Timestamp.now(),
      });
      const app = demoStore.getApplications().find((a) => a.id === id);
      if (app) {
        await notifyUser({
          userId: app.userId,
          title: 'Teslimin alındı',
          body: 'Admin ekibimiz içeriği inceliyor. Uygunsuz içerik kontrolünden sonra süreç devam eder.',
          type: 'general',
          data: { applicationId: id },
          showLocalForUserId: app.userId,
        });
        await notifyAdmins({
          title: 'Yeni teslim incelemesi',
          body: 'Kullanıcı görev teslimi yükledi. Moderasyon bekliyor.',
          type: 'general',
          data: { applicationId: id },
        });
      }
      return;
    }

    if (isBackendId(id) && (await useApplicationsRestBackend())) {
      await submitApplicationSubmission(
        id,
        submissionText,
        submissionFiles,
        submissionAttachments,
        submissionLinks
      );
      return;
    }

    if (await useApplicationsRestBackend()) {
      throw new Error('Teslim gönderilemedi. Başvuru kimliği geçersiz — sayfayı yenileyip tekrar dene.');
    }

    throw new Error('Teslim REST backend\'de henüz desteklenmiyor.');
  },

  async updateStatus(
    id: string,
    status: ApplicationStatus,
    reviewNote?: string
  ) {
    if (isBackendId(id) && (await useApplicationsRestBackend())) {
      if (status === 'rejected') {
        await rejectApplication(id);
        return;
      }
    }

    if (shouldUseDemoData()) {
      demoStore.updateApplication(id, {
        status,
        reviewNote: reviewNote ?? '',
        reviewedAt: Timestamp.now(),
      });
      return;
    }
    throw new Error('Başvuru durumu REST üzerinden güncellenmeli.');
  },

  async cancel(id: string, userId: string): Promise<boolean> {
    const application = await this.getById(id);
    if (!application) return false;
    if (!(await isCurrentApplicationOwner(application.userId, userId))) return false;
    if (!['pending', 'approved'].includes(application.status)) return false;

    if (isBackendId(id) && (await useApplicationsRestBackend())) {
      await withdrawApplication(id);
      return true;
    }

    await this.updateStatus(id, 'cancelled');
    return true;
  },
};

function mapIssuedStatus(statusRaw: BusinessIssuedCoupon['statusRaw']): Coupon['status'] {
  switch (statusRaw) {
    case 'USED':
      return 'exhausted';
    case 'EXPIRED':
      return 'expired';
    case 'SWAPPED':
      return 'traded';
    default:
      return 'active';
  }
}

function mapIssuedToCoupon(c: BusinessIssuedCoupon, businessId: string): Coupon {
  const status = mapIssuedStatus(c.statusRaw);
  return {
    id: c.id,
    userId: '',
    businessId,
    taskId: '',
    applicationId: '',
    rewardDescription: c.rewardDescription,
    totalUses: c.quantity,
    usedCount: c.statusRaw === 'USED' ? c.quantity : 0,
    qrCode: c.id,
    couponCode: formatCouponCodeFromId(c.id),
    expiresAt: Timestamp.now(),
    usageHistory: [],
    status,
    createdAt: c.issuedAt ?? Timestamp.now(),
  };
}

export const couponsRepository = {
  async getById(id: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.getCoupons().find((c) => c.id === id) ?? null;
    }

    if (await hasRestAuthSession()) {
      try {
        return await fetchRestCouponById(id);
      } catch {
        return null;
      }
    }

    return null;
  },

  async getByApplicationId(applicationId: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.getCoupons().find((c) => c.applicationId === applicationId) ?? null;
    }

    if (await hasRestAuthSession()) {
      try {
        return await fetchCouponByApplicationId(applicationId);
      } catch {
        return null;
      }
    }

    return null;
  },

  async getByCode(code: string): Promise<Coupon | null> {
    const normalized = code.trim().toUpperCase();
    if (shouldUseDemoData()) {
      return demoStore.getCouponByCode(normalized);
    }
    return null;
  },

  async getByUser(userId: string, status?: Coupon['status']): Promise<Coupon[]> {
    if (shouldUseDemoData()) {
      let list = demoStore.getCoupons().filter((c) => c.userId === userId);
      if (status) list = list.filter((c) => c.status === status);
      return list;
    }

    if (await hasRestAuthSession()) {
      try {
        const backendStatus =
          status === 'active' ? ('ACTIVE' as const) : undefined;
        let list = await fetchRestCoupons(backendStatus);
        if (status && status !== 'active') {
          list = list.filter((c) => c.status === status);
        }
        return list;
      } catch {
        return [];
      }
    }

    return [];
  },

  async getActiveByUser(userId: string): Promise<Coupon[]> {
    return this.getByUser(userId, 'active');
  },

  async getByBusiness(businessId: string): Promise<Coupon[]> {
    if (await useApplicationsRestBackend()) {
      try {
        const issued = await fetchIssuedCoupons();
        return issued.map((c) => mapIssuedToCoupon(c, businessId));
      } catch {
        return [];
      }
    }
    if (shouldUseDemoData()) {
      return demoStore.getCouponsByBusiness(businessId);
    }
    return [];
  },

  async createFromApplication(
    application: Application,
    task: Task,
    _verifiedBy: string
  ): Promise<Coupon> {
    const couponData: Omit<Coupon, 'id'> = {
      userId: application.userId,
      businessId: application.businessId,
      taskId: application.taskId,
      applicationId: application.id,
      rewardDescription: task.rewardDescription,
      totalUses: task.rewardQuantity,
      usedCount: 0,
      qrCode: `qr-${Date.now()}`,
      couponCode: generateCouponCode(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
      usageHistory: [],
      status: 'active',
      createdAt: Timestamp.now(),
    };

    if (shouldUseDemoData()) {
      const coupon: Coupon = { id: `demo-c${Date.now()}`, ...couponData };
      demoStore.addCoupon(coupon);
      await applicationsRepository.updateStatus(application.id, 'rewarded');
      await usersRepository.incrementCompletedTasks(application.userId);
      return coupon;
    }

    throw new Error('Kupon yalnızca Cloud Functions ile oluşturulabilir.');
  },

  async redeem(couponId: string, scannedBy: string): Promise<Coupon | null> {
    if (shouldUseDemoData()) {
      return demoStore.redeemCoupon(couponId, scannedBy);
    }

    if (await useApplicationsRestBackend()) {
      // İşletme paneli kupon doğrulamayı verifyCouponByToken ile yapar.
      return null;
    }

    return null;
  },
};

/** pending → approved (kupon yok, kullanıcı teslim edecek) */
export async function approveApplication(
  applicationId: string,
  reviewNote?: string
): Promise<Application | null> {
  const application = await applicationsRepository.getById(applicationId);
  if (!application || application.status !== 'pending') return null;

  if (isBackendId(applicationId) && (await useApplicationsRestBackend())) {
    try {
      await reviewApplication(applicationId);
    } catch {
      // Zaten incelemede olabilir — kabul adımına devam et
    }
    await acceptApplication(applicationId);
    return applicationsRepository.getById(applicationId);
  }

  if (shouldUseDemoData()) {
    await applicationsRepository.updateStatus(applicationId, 'approved', reviewNote);
    await notifyUser({
      userId: application.userId,
      title: 'Başvurun onaylandı',
      body: 'Görevi tamamlayıp teslim edebilirsin. Başvurularım sekmesinden devam et.',
      type: 'application_approved',
      data: { applicationId },
      showLocalForUserId: application.userId,
    });
    return applicationsRepository.getById(applicationId);
  }

  throw new Error('Başvuru onayı REST backend\'de işletme panelinden yapılır.');
}

/** submission_approved → rewarded + kupon (admin + işletme onayı sonrası) */
export async function issueCouponForSubmission(
  applicationId: string,
  businessOwnerUid: string,
  reviewNote?: string
): Promise<Coupon | null> {
  const application = await applicationsRepository.getById(applicationId);
  if (!application || application.status !== 'submission_approved') return null;

  if (shouldUseDemoData()) {
    const task = await tasksRepository.getById(application.taskId);
    if (!task) return null;

    const coupon = await couponsRepository.createFromApplication(
      application,
      task,
      businessOwnerUid
    );

    await notifyUser({
      userId: application.userId,
      title: 'Tebrikler! Kuponun hazır',
      body: `Görev teslimin onaylandı. Kupon kodun: ${coupon.couponCode}`,
      type: 'coupon_issued',
      data: { applicationId, couponId: coupon.id },
      showLocalForUserId: application.userId,
    });

    refreshPendingFeedbackGate();

    return coupon;
  }

  if (await useApplicationsRestBackend()) {
    const { issueBusinessCoupon, mapCouponDto } = await import('../coupon/businessCouponsApi');
    const task = await tasksRepository.getById(application.taskId);
    const dto = await issueBusinessCoupon(applicationId, reviewNote);
    const coupon = mapCouponDto(
      dto,
      applicationId,
      application.taskId,
      application.userId
    );
    if (task && !coupon.rewardDescription) {
      coupon.rewardDescription = task.rewardDescription;
    }

    await notifyUser({
      userId: application.userId,
      title: 'Tebrikler! Kuponun hazır',
      body: `Görev teslimin onaylandı. Cüzdanından kuponunu kullanabilirsin.`,
      type: 'coupon_issued',
      data: { applicationId, couponId: coupon.id },
      showLocalForUserId: application.userId,
    });

    refreshPendingFeedbackGate();

    return coupon;
  }

  if (await useApplicationsRestBackend()) {
    throw new Error('Kupon oluşturulamadı. Başvuru kimliği geçersiz veya oturum süresi dolmuş olabilir.');
  }

  throw new Error('Kupon oluşturma REST backend\'de henüz desteklenmiyor.');
}
