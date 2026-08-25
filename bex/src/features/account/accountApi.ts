import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api/axiosInstance';

export interface DeleteAccountPayload {
  password: string;
  reason?: string;
}

function mapAccountApiError(error: unknown): Error & { code?: string } {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { code?: string; message?: string } | undefined;
    const message = data?.message ?? getApiErrorMessage(error);
    if (message.includes('Şifre hatalı')) {
      return Object.assign(new Error(message), { code: 'account/wrong-password' });
    }
    if (!error.response) {
      return Object.assign(new Error('Sunucuya bağlanılamadı. Bağlantını kontrol et.'), {
        code: 'account/network-request-failed',
      });
    }
    return Object.assign(new Error(message), { code: data?.code ?? 'account/unknown' });
  }
  if (error instanceof Error) return error;
  return Object.assign(new Error('Bilinmeyen bir hata oluştu.'), { code: 'account/unknown' });
}

export async function deleteAccountRequest(payload: DeleteAccountPayload): Promise<void> {
  try {
    await apiClient.delete('/api/account/me', {
      data: {
        password: payload.password,
        reason: payload.reason?.trim() || null,
      },
    });
  } catch (error) {
    throw mapAccountApiError(error);
  }
}

export async function exportAccountDataRequest(): Promise<unknown> {
  try {
    const { data } = await apiClient.get<unknown>('/api/account/me/export');
    return data;
  } catch (error) {
    throw mapAccountApiError(error);
  }
}
