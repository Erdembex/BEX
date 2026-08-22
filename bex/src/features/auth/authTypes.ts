/** Oturum bilgisi — eski firebaseUser alanıyla uyumlu */
export interface AuthSession {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  userType: 'BUSINESS' | 'INDIVIDUAL' | string;
  profileId: string;
}

export interface RegisterPendingResponseDto {
  email: string;
  message: string;
  devVerificationCode?: string | null;
}

export interface IndividualProfileDto {
  id: string;
  username: string;
  fullName: string;
  city: string;
  district: string;
  avatarUrl?: string | null;
  bio?: string | null;
  cvUrl?: string | null;
  skills?: string[];
  phone?: string | null;
  phoneVerified?: boolean;
}

export interface BusinessProfileDto {
  id: string;
  businessName: string;
  category: string;
  city: string;
  district: string;
  openAddress?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  bio?: string | null;
  verified?: boolean;
  verificationStatus?: string | null;
  verificationDocumentUrl?: string | null;
  verificationDocumentName?: string | null;
  phoneVerified?: boolean;
}
