import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { shouldUseDemoData } from '../../lib/devMode';
import { usesRestBackend } from '../../lib/restBackend';
import { Task, TaskCategory, TaskDifficulty, Business, CreateBusiness, CreateTask } from '../../types';
import { matchesSearch } from '../../lib/taskUtils';
import {
  DEMO_BUSINESSES,
  enrichTasksWithBusiness,
  getDemoBusinessName,
} from '../../lib/demoData';
import { demoStore } from '../../lib/demoStore';
import {
  closeListing,
  createListing,
  discoverListings,
  fetchBusinessListings,
  fetchListingDetail,
  publishBusinessListing,
  shouldUseListingsRest,
  updateListing,
} from '../listing/listingsApi';
import { isBackendId } from '@/lib/api/backendId';
import { toApiCityFilter, toApiDistrictFilter } from '@/lib/locationFilterUtils';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  fetchOwnBusinessProfile,
  fetchPublicBusinessProfile,
} from '../business/businessProfileApi';

const ACCEPTED_APPLICATION_STATUSES = new Set([
  'approved',
  'submitted',
  'submission_approved',
  'rewarded',
]);

const INACTIVE_APPLICATION_STATUSES = new Set(['rejected', 'cancelled']);

function enrichTasksWithApplicationCounts(tasks: Task[], businessId: string): Task[] {
  const apps = demoStore.getApplicationsByBusiness(businessId);
  return tasks.map((task) => {
    const taskApps = apps.filter((app) => app.taskId === task.id);
    return {
      ...task,
      currentApplicantCount: taskApps.filter(
        (app) => !INACTIVE_APPLICATION_STATUSES.has(app.status)
      ).length,
      acceptedApplicantCount: taskApps.filter((app) =>
        ACCEPTED_APPLICATION_STATUSES.has(app.status)
      ).length,
    };
  });
}

export type EnrichedTask = Task & {
  businessName: string;
  businessLogoUrl?: string | null;
  businessVerified?: boolean;
  businessIsDangerous?: boolean;
  businessComplaintListed?: boolean;
  businessAverageRating?: number;
  businessFeedbackCount?: number;
  locationLabel?: string;
  businessLatitude?: number;
  businessLongitude?: number;
};

function asEnriched(tasks: EnrichedTask[]): EnrichedTask[] {
  return tasks.map((task) => {
    const biz = DEMO_BUSINESSES.find((b) => b.id === task.businessId);
    return {
      ...task,
      businessName: task.businessName || getDemoBusinessName(task.businessId),
      businessVerified: task.businessVerified ?? false,
      businessAverageRating: task.businessAverageRating ?? biz?.averageRating,
      businessFeedbackCount: task.businessFeedbackCount ?? biz?.feedbackCount,
    };
  });
}

export const tasksRepository = {
  async getById(id: string): Promise<Task | null> {
    if (shouldUseDemoData()) {
      return demoStore.getTaskById(id) ?? null;
    }

    if (isBackendId(id)) {
      try {
        const listing = await fetchListingDetail(id);
        if (listing) return listing;
      } catch {
        return null;
      }
    }

    return null;
  },

  async getFeatured(limitCount = 5): Promise<EnrichedTask[]> {
    if (await shouldUseListingsRest()) {
      try {
        const page = await discoverListings({ pageSize: limitCount });
        if (page.tasks.length > 0) return asEnriched(page.tasks);
      } catch {
        // demo yedeğine düş
      }
    }

    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness(
        demoStore.getFeaturedTasks(limitCount),
        demoStore.getBusinesses()
      );
    }

    return [];
  },

  async getActive(
    pageSize = 10,
    cursor?: QueryDocumentSnapshot<DocumentData> | string | null,
    filters?: {
      city?: string;
      district?: string;
      category?: TaskCategory | null;
      skills?: string[];
      q?: string;
      rewardType?: string;
    }
  ): Promise<{
    tasks: EnrichedTask[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    nextCursor: string | null;
  }> {
    const restCursor = typeof cursor === 'string' ? cursor : undefined;

    if (await shouldUseListingsRest()) {
      try {
        const { mapCategoryToBackendSkill } = await import('../listing/listingsApi');
        const skills =
          filters?.skills?.length
            ? filters.skills
            : filters?.category != null
              ? [mapCategoryToBackendSkill(filters.category)]
              : undefined;
        const page = await discoverListings({
          pageSize,
          cursor: restCursor,
          city: toApiCityFilter(filters?.city),
          district: toApiDistrictFilter(filters?.city, filters?.district),
          skills,
          q: filters?.q,
          rewardType: filters?.rewardType,
        });
        return {
          tasks: asEnriched(page.tasks),
          lastDoc: null,
          nextCursor: page.nextCursor,
        };
      } catch {
        if (shouldUseDemoData()) {
          const visible = demoStore.getVisibleTasks();
          return {
            tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
            lastDoc: null,
            nextCursor: null,
          };
        }
        return { tasks: [], lastDoc: null, nextCursor: null };
      }
    }

    if (shouldUseDemoData()) {
      const visible = demoStore.getVisibleTasks();
      return {
        tasks: enrichTasksWithBusiness(visible, demoStore.getBusinesses()),
        lastDoc: null,
        nextCursor: null,
      };
    }

    return { tasks: [], lastDoc: null, nextCursor: null };
  },

  async search(
    searchTerm: string,
    category: TaskCategory | null,
    difficulty: TaskDifficulty | null
  ): Promise<EnrichedTask[]> {
    const trimmed = searchTerm.trim();
    if (await shouldUseListingsRest()) {
      try {
        const { mapCategoryToBackendSkill } = await import('../listing/listingsApi');
        const skills =
          category != null ? [mapCategoryToBackendSkill(category)] : undefined;
        const page = await discoverListings({
          pageSize: 30,
          skills,
          q: trimmed || undefined,
        });
        return page.tasks.filter((t) => !difficulty || t.difficulty === difficulty);
      } catch {
        // client fallback below
      }
    }

    const { tasks } = await this.getActive(50);
    return tasks.filter((t) => {
      if (category && t.category !== category) return false;
      if (difficulty && t.difficulty !== difficulty) return false;
      if (trimmed && !matchesSearch(t.title, t.description, trimmed)) return false;
      return true;
    });
  },

  async getEnrichedById(id: string): Promise<EnrichedTask | null> {
    const task = await this.getById(id);
    if (!task) return null;
    if (shouldUseDemoData()) {
      return enrichTasksWithBusiness([task], demoStore.getBusinesses())[0] ?? null;
    }
    return asEnriched([task as EnrichedTask])[0] ?? null;
  },

  async getSimilar(task: Task, limitCount = 3): Promise<EnrichedTask[]> {
    const { tasks } = await this.getActive(20);
    return tasks
      .filter((t) => t.id !== task.id && t.category === task.category)
      .slice(0, limitCount);
  },

  async getByBusiness(businessId: string): Promise<Task[]> {
    if (await shouldUseListingsRest()) {
      try {
        const listings = await fetchBusinessListings();
        return listings.filter(
          (listing) =>
            !businessId ||
            !listing.businessId ||
            listing.businessId === businessId ||
            isBackendId(businessId)
        );
      } catch {
        if (shouldUseDemoData()) {
          return enrichTasksWithApplicationCounts(
            demoStore.getTasksByBusiness(businessId),
            businessId
          );
        }
        return [];
      }
    }

    if (shouldUseDemoData()) {
      return enrichTasksWithApplicationCounts(
        demoStore.getTasksByBusiness(businessId),
        businessId
      );
    }

    return [];
  },

  async getPublicActiveByBusiness(businessId: string): Promise<EnrichedTask[]> {
    const tasks = await this.getByBusiness(businessId);
    return asEnriched(
      tasks.filter((t) => t.status === 'active' && t.approvedByAdmin) as EnrichedTask[]
    );
  },

  async create(businessId: string, data: CreateTask): Promise<EnrichedTask> {
    if (shouldUseDemoData()) {
      const task = demoStore.createTask(businessId, data);
      demoStore.setTaskAdminApproval(task.id, true);
      demoStore.updateTask(task.id, { status: 'active' });
      return enrichTasksWithApplicationCounts([task], businessId)[0] as EnrichedTask;
    }

    if (!(await hasRestAuthSession())) {
      throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
    }

    return createListing(data);
  },

  async publish(taskId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.setTaskAdminApproval(taskId, true);
      demoStore.updateTask(taskId, { status: 'active' });
      return;
    }

    if (!(await hasRestAuthSession())) {
      throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
    }

    await publishBusinessListing(taskId);
  },

  async createAndPublish(businessId: string, data: CreateTask): Promise<string> {
    const task = await this.create(businessId, data);
    if (!task.approvedByAdmin && !shouldUseDemoData()) {
      await this.publish(task.id);
    }
    return task.id;
  },

  async update(
    taskId: string,
    businessId: string,
    data: Partial<Omit<Task, 'id' | 'businessId' | 'createdAt' | 'currentApplicantCount'>>
  ): Promise<void> {
    if (shouldUseDemoData()) {
      const task = demoStore.getTaskById(taskId);
      if (!task || task.businessId !== businessId) {
        throw new Error('Görev bulunamadı');
      }
      if (task.approvedByAdmin) {
        throw new Error('Yayınlanmış görev düzenlenemez');
      }
      demoStore.updateTask(taskId, data);
      return;
    }

    const current = await this.getById(taskId);
    if (!current || current.businessId !== businessId) {
      throw new Error('Görev bulunamadı');
    }
    if (current.approvedByAdmin) {
      throw new Error('Yayınlanmış görev düzenlenemez');
    }

    const merged: CreateTask = {
      businessId,
      title: data.title ?? current.title,
      description: data.description ?? current.description,
      category: data.category ?? current.category,
      difficulty: data.difficulty ?? current.difficulty,
      estimatedHours: data.estimatedHours ?? current.estimatedHours,
      rewardDescription: data.rewardDescription ?? current.rewardDescription,
      rewardQuantity: data.rewardQuantity ?? current.rewardQuantity,
      maxApplicants: data.maxApplicants ?? current.maxApplicants,
      status: data.status ?? current.status,
      location: data.location ?? current.location,
      deadline: data.deadline ?? current.deadline,
    };

    await updateListing(taskId, merged);
  },

  async setStatus(
    taskId: string,
    businessId: string,
    status: Task['status']
  ): Promise<void> {
    if (shouldUseDemoData()) {
      const task = demoStore.getTaskById(taskId);
      if (!task || task.businessId !== businessId) {
        throw new Error('Görev bulunamadı');
      }
      if (task.status === 'draft' && status === 'paused') {
        throw new Error('Taslak görev duraklatılamaz.');
      }
      if (task.status === 'draft' && status === 'active') {
        demoStore.setTaskAdminApproval(taskId, true);
      }
      demoStore.updateTask(taskId, { status });
      return;
    }

    if (!(await hasRestAuthSession())) {
      throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
    }

    if (status === 'paused' || status === 'completed') {
      await closeListing(taskId);
      return;
    }

    if (status === 'active') {
      await publishBusinessListing(taskId);
      return;
    }

    throw new Error('Bu durum değişikliği desteklenmiyor.');
  },

  async cancel(taskId: string): Promise<void> {
    if (!(await hasRestAuthSession())) {
      throw new Error('Oturum bulunamadı. Tekrar giriş yap.');
    }
    await closeListing(taskId);
  },
};

export const businessesRepository = {
  async getById(id: string): Promise<Business | null> {
    if (shouldUseDemoData()) {
      return demoStore.getBusinessById(id) ?? DEMO_BUSINESSES.find((b) => b.id === id) ?? null;
    }

    if ((await hasRestAuthSession()) && isBackendId(id)) {
      try {
        return await fetchPublicBusinessProfile(id);
      } catch {
        return null;
      }
    }

    return null;
  },

  async getPopular(limitCount = 10): Promise<Business[]> {
    if (shouldUseDemoData()) {
      return [...demoStore.getBusinesses()]
        .map((business) => {
          const activeListingCount = demoStore
            .getTasksByBusiness(business.id)
            .filter((task) => task.status === 'active').length;
          return {
            ...business,
            activeListingCount,
            totalTasksPublished: activeListingCount,
            averageRating: business.averageRating ?? business.reputationScore / 10,
            feedbackCount: business.feedbackCount ?? Math.max(0, Math.round(business.reputationScore / 8)),
          };
        })
        .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        .slice(0, limitCount);
    }

    if (await usesRestBackend()) {
      try {
        const { searchBusinessProfiles, fetchPublicBusinessProfile } = await import(
          '../business/businessProfileApi'
        );
        const hits = await searchBusinessProfiles('');
        const sorted = [...hits].sort((a, b) => Number(b.verified) - Number(a.verified));
        const profiles = await Promise.all(
          sorted.slice(0, limitCount).map((hit) => fetchPublicBusinessProfile(hit.profileId))
        );
        return profiles
          .filter((b): b is Business => b != null)
          .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
      } catch {
        return [];
      }
    }

    return [];
  },

  async getByOwner(ownerUid: string): Promise<Business | null> {
    if (await hasRestAuthSession()) {
      try {
        return await fetchOwnBusinessProfile(ownerUid);
      } catch {
        return null;
      }
    }

    if (shouldUseDemoData()) {
      return demoStore.getBusinessByOwner(ownerUid);
    }
    return null;
  },

  async create(data: CreateBusiness): Promise<string> {
    if (shouldUseDemoData()) {
      const business = demoStore.createBusiness(data.ownerUid, data);
      return business.id;
    }
    throw new Error('İşletme kaydı REST üzerinden yapılır.');
  },

  async update(_id: string, _data: Partial<Omit<Business, 'id' | 'createdAt'>>) {
    if (shouldUseDemoData()) {
      demoStore.updateBusiness(_id, _data);
      return;
    }
    throw new Error('İşletme profili REST üzerinden güncellenir.');
  },
};
