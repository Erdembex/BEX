import * as FileSystem from 'expo-file-system/legacy';
import { clearAuthenticatedImageCache } from '@/lib/authenticatedImage';

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** idx;
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

async function directorySize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return 0;
    if (!info.isDirectory) return info.size ?? 0;

    const entries = await FileSystem.readDirectoryAsync(uri);
    let total = 0;
    for (const entry of entries) {
      total += await directorySize(`${uri}/${entry}`);
    }
    return total;
  } catch {
    return 0;
  }
}

export async function getAppCacheSizeBytes(): Promise<number> {
  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return 0;
  return directorySize(cacheDir);
}

export async function getAppCacheSizeLabel(): Promise<string> {
  const bytes = await getAppCacheSizeBytes();
  return formatBytes(bytes);
}

export async function clearAppCache(): Promise<void> {
  clearAuthenticatedImageCache();

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) return;

  try {
    const entries = await FileSystem.readDirectoryAsync(cacheDir);
    await Promise.all(
      entries.map((entry) =>
        FileSystem.deleteAsync(`${cacheDir}${entry}`, { idempotent: true })
      )
    );
  } catch {
    /* sessiz */
  }
}
