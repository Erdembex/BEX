import { GeoPoint, Timestamp } from 'firebase/firestore';
import { Application, Business, Task } from '../types';

const ts = (daysFromNow: number) =>
  Timestamp.fromDate(new Date(Date.now() + daysFromNow * 86400000));

const loc = new GeoPoint(41.0082, 28.9784);

export const DEMO_BUSINESSES: Business[] = [
  {
    id: 'demo-b1',
    ownerUid: 'demo',
    name: 'Studio Cut',
    category: 'beauty',
    logoUrl: '',
    address: 'Kadıköy, İstanbul',
    location: loc,
    isVerified: true,
    verificationStatus: 'verified',
    reputationScore: 92,
    totalTasksPublished: 12,
    averageRating: 4.6,
    feedbackCount: 18,
    activeListingCount: 3,
    createdAt: ts(-30),
  },
  {
    id: 'demo-b2',
    ownerUid: 'demo',
    name: 'FitZone Spor',
    category: 'fitness',
    logoUrl: '',
    address: 'Beşiktaş, İstanbul',
    location: loc,
    isVerified: true,
    verificationStatus: 'verified',
    reputationScore: 88,
    totalTasksPublished: 8,
    averageRating: 4.4,
    feedbackCount: 11,
    activeListingCount: 2,
    createdAt: ts(-20),
  },
  {
    id: 'demo-b3',
    ownerUid: 'demo',
    name: 'Kahve Dünyası',
    category: 'food',
    logoUrl: '',
    address: 'Moda, İstanbul',
    location: loc,
    isVerified: true,
    verificationStatus: 'verified',
    reputationScore: 85,
    totalTasksPublished: 15,
    averageRating: 4.2,
    feedbackCount: 24,
    activeListingCount: 4,
    createdAt: ts(-10),
  },
  {
    id: 'demo-b-pending',
    ownerUid: 'demo-pending-owner',
    name: 'Yeni Açılan Kafe',
    category: 'food',
    logoUrl: '',
    address: 'Beşiktaş, İstanbul',
    location: loc,
    isVerified: false,
    verificationStatus: 'pending',
    verificationDocumentUrl: 'https://example.com/demo-vergi-levhasi.pdf',
    reputationScore: 0,
    totalTasksPublished: 0,
    createdAt: ts(-2),
  },
];

export const DEMO_TASKS: Task[] = [
  {
    id: 'demo-t1',
    businessId: 'demo-b1',
    title: 'Modern web sitesi tasarla',
    description:
      'Kuaförümüz için mobil uyumlu, modern bir web sitesi tasarlayın. Figma veya canlı site teslimi kabul edilir.',
    category: 'design',
    difficulty: 'medium',
    estimatedHours: 8,
    rewardDescription: '5 ücretsiz saç tıraşı',
    rewardQuantity: 5,
    maxApplicants: 3,
    currentApplicantCount: 1,
    status: 'active',
    location: loc,
    deadline: ts(14),
    createdAt: ts(-2),
    approvedByAdmin: true,
    featured: true,
  },
  {
    id: 'demo-t2',
    businessId: 'demo-b2',
    title: 'Sosyal medya içerik paketi',
    description:
      'Spor salonumuz için 10 adet Instagram postu ve 3 Reels videosu hazırlayın.',
    category: 'marketing',
    difficulty: 'hard',
    estimatedHours: 12,
    rewardDescription: '1 aylık spor salonu üyeliği',
    rewardQuantity: 1,
    maxApplicants: 2,
    currentApplicantCount: 0,
    status: 'active',
    location: loc,
    deadline: ts(21),
    createdAt: ts(-1),
    approvedByAdmin: true,
    featured: true,
  },
  {
    id: 'demo-t3',
    businessId: 'demo-b3',
    title: 'Google Maps yorumları yaz',
    description:
      'Kafemize gerçek ziyaret sonrası detaylı Google yorumu yazın. Fotoğraflı yorum tercih edilir.',
    category: 'content',
    difficulty: 'easy',
    estimatedHours: 1,
    rewardDescription: '10 ücretsiz kahve',
    rewardQuantity: 10,
    maxApplicants: 10,
    currentApplicantCount: 4,
    status: 'active',
    location: loc,
    deadline: ts(7),
    createdAt: ts(-3),
    approvedByAdmin: true,
    featured: false,
  },
  {
    id: 'demo-t4',
    businessId: 'demo-b1',
    title: 'Logo ve kartvizit tasarımı',
    description: 'Yeni açılan şubemiz için logo ve kartvizit seti tasarlayın.',
    category: 'design',
    difficulty: 'easy',
    estimatedHours: 4,
    rewardDescription: '3 ücretsiz saç tıraşı',
    rewardQuantity: 3,
    maxApplicants: 5,
    currentApplicantCount: 2,
    status: 'active',
    location: loc,
    deadline: ts(10),
    createdAt: ts(-5),
    approvedByAdmin: true,
    featured: false,
  },
  {
    id: 'demo-t-pending',
    businessId: 'demo-b2',
    title: 'Menü fotoğrafçılığı (onay bekliyor)',
    description:
      'Restoran menüsü için profesyonel yemek fotoğrafları çekin ve düzenleyin.',
    category: 'photography',
    difficulty: 'medium',
    estimatedHours: 6,
    rewardDescription: '2 ücretsiz öğle yemeği',
    rewardQuantity: 2,
    maxApplicants: 2,
    currentApplicantCount: 0,
    status: 'active',
    location: loc,
    deadline: ts(14),
    createdAt: ts(-1),
    approvedByAdmin: false,
    featured: false,
  },
];

export function getDemoBusinessName(businessId: string): string {
  return DEMO_BUSINESSES.find((b) => b.id === businessId)?.name ?? 'İşletme';
}

export function enrichTasksWithBusiness(
  tasks: Task[],
  businesses: Business[] = DEMO_BUSINESSES
) {
  return tasks.map((t) => {
    const biz =
      businesses.find((b) => b.id === t.businessId) ??
      DEMO_BUSINESSES.find((b) => b.id === t.businessId);
    return {
      ...t,
      businessName: biz?.name ?? 'İşletme',
      businessVerified: biz?.isVerified ?? false,
      businessAverageRating: biz?.averageRating,
      businessFeedbackCount: biz?.feedbackCount,
    };
  });
}

export const DEMO_APPLICATIONS: Application[] = [
  {
    id: 'demo-a1',
    taskId: 'demo-t1',
    userId: 'demo-user-1',
    businessId: 'demo-b1',
    status: 'pending',
    coverLetter:
      '3 yıllık UI/UX deneyimim var. Kuaför siteleri için benzer projeler yaptım.',
    portfolioUrl: 'https://behance.net/ornek',
    submissionText: '',
    submissionFiles: [],
    createdAt: ts(-1),
  },
  {
    id: 'demo-a-portfolio',
    taskId: 'demo-t2',
    userId: 'demo-user-1',
    businessId: 'demo-b2',
    status: 'rewarded',
    coverLetter: 'Sosyal medya içerikleri hazırladım.',
    portfolioUrl: '',
    submissionText: 'Instagram post ve story setleri.',
    submissionFiles: [
      'https://picsum.photos/seed/bex-portfolio-1/400/400',
      'https://picsum.photos/seed/bex-portfolio-2/400/400',
      'https://picsum.photos/seed/bex-portfolio-3/400/400',
    ],
    submittedAt: ts(-12),
    reviewedAt: ts(-11),
    createdAt: ts(-14),
  },
  {
    id: 'demo-a2',
    taskId: 'demo-t4',
    userId: 'demo-user-2',
    businessId: 'demo-b1',
    status: 'submitted',
    coverLetter: 'Logo tasarımında Adobe Illustrator uzmanıyım.',
    portfolioUrl: '',
    submissionText: 'Kartvizit ve logo setini ekte paylaşıyorum.',
    submissionFiles: ['https://example.com/logo.pdf'],
    submittedAt: ts(-0.5),
    createdAt: ts(-3),
  },
  {
    id: 'demo-a3',
    taskId: 'demo-t3',
    userId: 'demo-user-3',
    businessId: 'demo-b3',
    status: 'pending',
    coverLetter: 'Moda semtinde yaşıyorum, kafenize sık sık uğrarım.',
    submissionText: '',
    submissionFiles: [],
    createdAt: ts(-2),
  },
];
