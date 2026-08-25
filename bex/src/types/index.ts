import { GeoPoint, Timestamp } from 'firebase/firestore';

// ─── Kullanıcı ───────────────────────────────────────────────
export type UserRole = 'user' | 'business' | 'admin';

export interface BexUser {
  uid: string;
  role: UserRole;
  displayName: string;
  username?: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  avatarUrl: string;
  bio?: string;
  cvUrl?: string;
  city?: string;
  district?: string;
  reputationScore: number;
  completedTaskCount: number;
  averageRating?: number;
  feedbackCount?: number;
  portfolioItems: PortfolioItem[];
  joinedAt: Timestamp;
  isBanned: boolean;
  expoPushToken?: string;
}

/** Admin onaylı teslim görselleri — işletmeler başvuru öncesi görür */
export interface PortfolioItem {
  id: string;
  imageUrl: string;
  taskTitle: string;
  applicationId: string;
  approvedAt: Timestamp;
}

/** Tamamlanan görev özeti — portföy listesinde gösterilir */
export interface CompletedTask {
  applicationId: string;
  taskTitle: string;
  completedAt: Timestamp;
  imageCount: number;
  previewImageUrl?: string | null;
}

export type CreateBexUser = Omit<BexUser, 'joinedAt'> & {
  joinedAt: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
};

// ─── İşletme ─────────────────────────────────────────────────
export type BusinessCategory =
  | 'food'
  | 'beauty'
  | 'fitness'
  | 'education'
  | 'retail'
  | 'services'
  | 'entertainment'
  | 'other';

export type BusinessVerificationStatus =
  | 'none'
  | 'pending'
  | 'verified'
  | 'rejected';

export interface Business {
  id: string;
  ownerUid: string;
  name: string;
  category: BusinessCategory;
  logoUrl: string;
  address: string;
  location: GeoPoint;
  isVerified: boolean;
  verificationStatus: BusinessVerificationStatus;
  verificationDocumentUrl?: string;
  reputationScore: number;
  totalTasksPublished: number;
  complaintListed?: boolean;
  isDangerous?: boolean;
  completedTaskCount?: number;
  approvedComplaintCount?: number;
  complaintRate?: number;
  averageRating?: number;
  feedbackCount?: number;
  activeListingCount?: number;
  createdAt: Timestamp;
}

export type CreateBusiness = Omit<
  Business,
  | 'id'
  | 'createdAt'
  | 'isVerified'
  | 'verificationStatus'
  | 'verificationDocumentUrl'
  | 'reputationScore'
  | 'totalTasksPublished'
>;

// ─── Görev ───────────────────────────────────────────────────
export type TaskCategory =
  | 'design'
  | 'development'
  | 'marketing'
  | 'content'
  | 'photography'
  | 'video'
  | 'translation'
  | 'consulting'
  | 'other';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Task {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedHours: number;
  rewardDescription: string;
  rewardQuantity: number;
  maxApplicants: number;
  currentApplicantCount: number;
  acceptedApplicantCount?: number;
  status: TaskStatus;
  location: GeoPoint;
  deadline: Timestamp;
  createdAt: Timestamp;
  approvedByAdmin: boolean;
  featured?: boolean;
  imageUrl?: string;
}

export type CreateTask = Omit<
  Task,
  'id' | 'currentApplicantCount' | 'createdAt' | 'approvedByAdmin' | 'featured'
>;

// ─── Başvuru ─────────────────────────────────────────────────
export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'submission_approved'
  | 'rewarded'
  | 'cancelled';

export interface Application {
  id: string;
  taskId: string;
  userId: string;
  businessId: string;
  status: ApplicationStatus;
  coverLetter: string;
  portfolioUrl?: string;
  submissionText: string;
  submissionFiles: string[];
  submissionAttachments?: string[];
  submissionLinks?: string[];
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewNote?: string;
  createdAt: Timestamp;
  /** Mevcut kullanıcı bu görev için puan verdi mi */
  feedbackSubmitted?: boolean;
  /** İşletme tarafında başvuran adı (REST detay yanıtından) */
  applicantName?: string;
}

export type CreateApplication = Pick<
  Application,
  'taskId' | 'businessId' | 'coverLetter' | 'portfolioUrl'
>;

// ─── Kupon ───────────────────────────────────────────────────
export type CouponStatus = 'active' | 'pending' | 'exhausted' | 'expired' | 'traded' | 'locked';

export interface CouponUsage {
  usedAt: Timestamp;
  scannedBy: string;
}

export interface Coupon {
  id: string;
  userId: string;
  businessId: string;
  taskId: string;
  applicationId: string;
  rewardDescription: string;
  totalUses: number;
  usedCount: number;
  qrCode: string;
  couponCode: string;
  expiresAt: Timestamp;
  usageHistory: CouponUsage[];
  status: CouponStatus;
  createdAt: Timestamp;
  businessName?: string;
}

// ─── Bildirim ────────────────────────────────────────────────
export type NotificationType =
  | 'application_approved'
  | 'application_rejected'
  | 'coupon_issued'
  | 'kyc_result'
  | 'task_approved'
  | 'message'
  | 'general'
  | 'trade_offer_received'
  | 'trade_offer_accepted'
  | 'trade_offer_rejected'
  | 'trade_offer_message';

export interface BexNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  read: boolean;
  createdAt: Timestamp;
}

export type ChatOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

export type ChatOffer = {
  id: string;
  messageId: string;
  listingId?: string;
  listingTitle?: string;
  listingDescription?: string;
  resultApplicationId?: string;
  rewardType: string;
  quantity: number;
  unit: string;
  validityDays: number;
  note?: string;
  status: ChatOfferStatus;
};

export type ChatMessageType = 'text' | 'offer' | 'image' | 'system';

// ─── Başvuru mesajları (FAZ 7) ───────────────────────────────
export interface ApplicationMessage {
  id: string;
  applicationId: string;
  senderId: string;
  senderRole: UserRole;
  text: string;
  createdAt: Timestamp;
  isRead?: boolean;
  messageType?: ChatMessageType;
  offer?: ChatOffer;
  /** Sohbet görseli — profilde asla gösterilmez */
  mediaUrl?: string;
}

export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

// ─── Auth form ───────────────────────────────────────────────
export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
  phone?: string;
  city?: string;
  district?: string;
  openAddress?: string;
  /** YYYY-MM-DD */
  birthDate?: string;
  gender?: UserGender;
}

// ─── Firestore koleksiyon isimleri ───────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  TASKS: 'tasks',
  APPLICATIONS: 'applications',
  COUPONS: 'coupons',
  BUSINESS_DOCUMENTS: 'business_documents',
  NOTIFICATIONS: 'notifications',
  TRADE_LISTINGS: 'trade_listings',
  TRADE_OFFERS: 'trade_offers',
} as const;
