import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '@/lib/api/axiosInstance';
import { getAccessToken } from '@/lib/auth/tokenStorage';
import { refreshAccessToken } from '@/lib/auth/authTokenRefresh';
import { isTokenExpired } from '@/lib/auth/jwtUtils';
import { isProtectedUploadUrl } from '@/lib/authenticatedImage';
import { normalizeUploadPath, resolveMediaUrl } from '@/lib/mediaUrl';

async function getValidAccessToken(): Promise<string | null> {
  let token = await getAccessToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }
  return token;
}

function guessExtension(url: string, contentType?: string): string {
  const path = normalizeUploadPath(url);
  const match = path.match(/\.([a-z0-9]+)$/i);
  if (match) return match[1].toLowerCase();
  if (contentType?.includes('pdf')) return 'pdf';
  return 'bin';
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/** JWT korumalı `/uploads/...` dosyasını tarayıcıda veya cihazda açar. */
export async function openProtectedMediaUrl(url: string): Promise<void> {
  if (!url?.trim()) {
    throw new Error('Dosya adresi bulunamadı.');
  }

  if (!isProtectedUploadUrl(url)) {
    await Linking.openURL(resolveMediaUrl(url));
    return;
  }

  const path = normalizeUploadPath(url);
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Oturum gerekli.');
  }

  const { data, headers } = await apiClient.get<ArrayBuffer>(path, {
    responseType: 'arraybuffer',
    headers: { Accept: 'application/pdf,application/octet-stream,*/*' },
  });

  const contentType =
    (headers['content-type'] as string | undefined)?.split(';')[0]?.trim() ||
    'application/octet-stream';
  const ext = guessExtension(url, contentType);

  if (Platform.OS === 'web') {
    const blob = new Blob([data], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      URL.revokeObjectURL(blobUrl);
      throw new Error('Pop-up engellendi. Tarayıcı izinlerini kontrol edin.');
    }
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  const localUri = `${FileSystem.cacheDirectory}passla-doc-${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(localUri, arrayBufferToBase64(data), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canOpen = await Linking.canOpenURL(localUri);
  if (!canOpen) {
    throw new Error('Dosya açılamadı.');
  }
  await Linking.openURL(localUri);
}
