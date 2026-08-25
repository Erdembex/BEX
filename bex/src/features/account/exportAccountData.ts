import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { exportAccountDataRequest } from './accountApi';

function fileName(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `passla-verilerim-${stamp}.json`;
}

/**
 * KVKK m.11 veri taşınabilirliği: hesaba ait verileri JSON olarak indirir ve
 * cihazın paylaşım penceresini açar (kaydet, e-postala, buluta yükle).
 */
export async function exportAccountDataToFile(): Promise<void> {
  const data = await exportAccountDataRequest();
  const json = JSON.stringify(data, null, 2);

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName();
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    return;
  }

  const uri = `${FileSystem.cacheDirectory}${fileName()}`;
  await FileSystem.writeAsStringAsync(uri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Bu cihazda dosya paylaşımı desteklenmiyor.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/json',
    dialogTitle: 'Passla verilerim',
    UTI: 'public.json',
  });
}
