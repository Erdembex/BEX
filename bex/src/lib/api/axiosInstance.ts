import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './config';
import { getAccessToken, clearTokens } from '../auth/tokenStorage';
import { refreshAccessToken } from '../auth/authTokenRefresh';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  // Spring Boot List<Enum> query binding: skills=A&skills=B (skills[]=A değil)
  paramsSerializer: {
    indexes: null,
  },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData: boundary otomatik eklenmeli (RN/axios multipart hatası önlenir)
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
      config.headers.delete('content-type');
    } else {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
      await clearTokens();
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'İstek tamamlanamadı. Lütfen tekrar dene.'): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
      fields?: Record<string, string>;
      code?: string;
    } | string>;
    const data = axiosError.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') {
      if (data.fields && typeof data.fields === 'object') {
        const parts = Object.values(data.fields).filter(Boolean);
        if (parts.length) return parts.join(' ');
      }
      if (data.code === 'INTERNAL_ERROR') {
        return data.message || 'Sunucu hatası. Biraz bekleyip tekrar dene; sorun sürerse destek ile iletişime geç.';
      }
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    if (axiosError.code === 'ECONNABORTED') {
      return 'Sunucu yanıt vermedi. İnternet bağlantını kontrol edip tekrar dene.';
    }
    if (!axiosError.response) {
      return 'Sunucuya bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.';
    }
    if (axiosError.response.status === 401) {
      return 'Oturumun sona erdi. Lütfen tekrar giriş yap.';
    }
    if (axiosError.message) return axiosError.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
