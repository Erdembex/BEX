import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api/axiosInstance';
import { saveTokens } from '@/lib/auth/tokenStorage';
import type {
  AuthResponseDto,
  BusinessProfileDto,
  IndividualProfileDto,
  RegisterPendingResponseDto,
} from './authTypes';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface BusinessRegisterPayload {
  email: string;
  password: string;
  businessName: string;
  category: string;
  city: string;
  district: string;
  openAddress: string;
  phone?: string;
}

export interface IndividualRegisterPayload {
  email: string;
  password: string;
  fullName: string;
  city: string;
  district: string;
  skills: string[];
}

function mapAuthApiError(error: unknown): Error & { code?: string } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { code?: string; message?: string; fields?: Record<string, string> }
      | undefined;
    const message = data?.message ?? getApiErrorMessage(error);

    if (message.includes('zaten kayıtlı')) {
      return Object.assign(new Error(message), { code: 'auth/email-already-in-use' });
    }
    if (message.includes('E-posta veya şifre')) {
      return Object.assign(new Error(message), { code: 'auth/invalid-credential' });
    }
    if (message.includes('askıya alınmış')) {
      return Object.assign(new Error(message), { code: 'auth/user-disabled' });
    }
    if (message.includes('Geçersiz veya süresi dolmuş')) {
      return Object.assign(new Error(message), { code: 'auth/invalid-reset-token' });
    }
    if (message.includes('henüz doğrulanmadı')) {
      return Object.assign(new Error(message), { code: 'auth/email-not-verified' });
    }
    if (message.includes('Yeni şifre mevcut')) {
      return Object.assign(new Error(message), { code: 'auth/same-password' });
    }
    if (data?.fields?.password) {
      return Object.assign(new Error(data.fields.password), { code: 'auth/weak-password' });
    }
    if (data?.fields?.email) {
      return Object.assign(new Error(data.fields.email), { code: 'auth/invalid-email' });
    }
    if (message.includes('açık adres')) {
      return Object.assign(new Error(message), { code: 'invalid-open-address' });
    }
    if (!error.response) {
      return Object.assign(
        new Error('Sunucuya bağlanılamadı. API adresini ve backend\'i kontrol et.'),
        { code: 'auth/network-request-failed' }
      );
    }
    return Object.assign(new Error(message), { code: data?.code ?? 'auth/unknown' });
  }
  if (error instanceof Error) return error;
  return Object.assign(new Error('Bilinmeyen bir hata oluştu.'), { code: 'auth/unknown' });
}

async function persistAuthResponse(data: AuthResponseDto): Promise<AuthResponseDto> {
  await saveTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponseDto> {
  try {
    const { data } = await apiClient.post<AuthResponseDto>('/api/auth/login', payload);
    return persistAuthResponse(data);
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function registerBusinessRequest(
  payload: BusinessRegisterPayload
): Promise<RegisterPendingResponseDto> {
  try {
    const { data } = await apiClient.post<RegisterPendingResponseDto>(
      '/api/auth/register/business',
      payload
    );
    return data;
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function registerIndividualRequest(
  payload: IndividualRegisterPayload
): Promise<RegisterPendingResponseDto> {
  try {
    const { data } = await apiClient.post<RegisterPendingResponseDto>(
      '/api/auth/register/individual',
      payload
    );
    return data;
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function verifyEmailRequest(
  email: string,
  code: string
): Promise<AuthResponseDto> {
  try {
    const { data } = await apiClient.post<AuthResponseDto>('/api/auth/verify-email', {
      email: email.trim(),
      code: code.trim().toUpperCase(),
    });
    return persistAuthResponse(data);
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function resendVerificationRequest(
  email: string
): Promise<{ devVerificationCode?: string }> {
  try {
    const response = await apiClient.post<{ devVerificationCode?: string }>(
      '/api/auth/resend-verification',
      { email: email.trim() }
    );
    return response.data ?? {};
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout', { refreshToken });
  } catch {
    // Yerel oturumu yine de kapat
  }
}

export async function forgotPasswordRequest(
  email: string
): Promise<{ devResetToken?: string }> {
  try {
    const response = await apiClient.post<{ devResetToken?: string }>(
      '/api/auth/forgot-password',
      { email: email.trim() }
    );
    return response.data ?? {};
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function resetPasswordRequest(token: string, newPassword: string): Promise<void> {
  try {
    await apiClient.post('/api/auth/reset-password', {
      token: token.trim().toUpperCase(),
      newPassword,
    });
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    await apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  } catch (error) {
    throw mapAuthApiError(error);
  }
}

export async function fetchIndividualProfile(): Promise<IndividualProfileDto> {
  const { data } = await apiClient.get<IndividualProfileDto>('/api/individual/profile');
  return data;
}

export async function fetchBusinessProfile(): Promise<BusinessProfileDto> {
  const { data } = await apiClient.get<BusinessProfileDto>('/api/business/profile');
  return data;
}

export async function updateIndividualProfile(
  profile: IndividualProfileDto
): Promise<IndividualProfileDto> {
  const { data } = await apiClient.patch<IndividualProfileDto>('/api/individual/profile', {
    username: profile.username,
    fullName: profile.fullName,
    city: profile.city,
    district: profile.district,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    cvUrl: profile.cvUrl ?? null,
    skills: profile.skills?.length ? profile.skills : ['OTHER'],
  });
  return data;
}

export async function updateBusinessProfile(
  profile: BusinessProfileDto
): Promise<BusinessProfileDto> {
  const { data } = await apiClient.patch<BusinessProfileDto>('/api/business/profile', {
    businessName: profile.businessName,
    category: profile.category ?? 'OTHER',
    city: profile.city,
    district: profile.district,
    phone: profile.phone ?? null,
    logoUrl: profile.logoUrl ?? null,
    bio: profile.bio ?? null,
    openAddress: profile.openAddress?.trim() || null,
  });
  return data;
}
