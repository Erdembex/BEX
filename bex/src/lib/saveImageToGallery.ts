import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { buildAuthenticatedImageSource } from '@/lib/authenticatedImage';

function extensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  return 'jpg';
}

/** Sohbet görselini cihaz galerisine kaydeder. Korumalı uploadlar data URI üzerinden indirilir. */
export async function saveChatImageToGallery(mediaUrl: string): Promise<void> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error('Galeriye kaydetmek için izin vermelisin.');
  }

  const source = await buildAuthenticatedImageSource(mediaUrl);
  const uri = source && typeof source === 'object' && 'uri' in source ? (source.uri as string) : null;
  if (!uri) {
    throw new Error('Görsel yüklenemedi.');
  }

  let fileUri = uri;

  if (uri.startsWith('data:')) {
    const match = uri.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) throw new Error('Görsel biçimi okunamadı.');
    const [, mime, base64] = match;
    fileUri = `${FileSystem.cacheDirectory}bex-chat-${Date.now()}.${extensionFromMime(mime)}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else if (!uri.startsWith('file:')) {
    const headers =
      source && typeof source === 'object' && 'headers' in source
        ? (source as { headers?: Record<string, string> }).headers
        : undefined;
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const dest = `${FileSystem.cacheDirectory}bex-chat-${Date.now()}.${ext}`;
    const download = await FileSystem.downloadAsync(uri, dest, headers ? { headers } : undefined);
    fileUri = download.uri;
  }

  await MediaLibrary.saveToLibraryAsync(fileUri);
}
