import { uploadLocalFiles } from '@/lib/storageUpload';
import { uploadSubmissionDocuments } from '@/features/media/mediaApi';

export interface SubmissionFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

/** Backend multipart limit (application.yml) */
export const MAX_SUBMISSION_FILE_BYTES = 25 * 1024 * 1024;

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/jpeg',
  '.heif': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
};

export function normalizeSubmissionFile(file: SubmissionFile): SubmissionFile {
  const extMatch = file.name.match(/(\.[a-z0-9]+)$/i);
  const ext = extMatch?.[1]?.toLowerCase() ?? '';
  const mapped = ext ? MIME_BY_EXT[ext] : undefined;
  const raw = file.mimeType?.toLowerCase() ?? '';
  const generic = !raw || raw === 'application/octet-stream' || raw === 'binary/octet-stream';

  return {
    ...file,
    name: file.name.replace(/[^\w.\-() ]+/g, '_'),
    mimeType: generic && mapped ? mapped : file.mimeType || mapped || 'application/octet-stream',
  };
}

export async function uploadSubmissionPhotos(
  applicationId: string,
  userId: string,
  files: SubmissionFile[]
): Promise<string[]> {
  if (files.length === 0) return [];
  const normalized = files.map(normalizeSubmissionFile);
  return uploadLocalFiles(`submissions/${userId}/${applicationId}/photos`, normalized);
}

export async function uploadSubmissionAttachments(
  applicationId: string,
  userId: string,
  files: SubmissionFile[]
): Promise<string[]> {
  if (files.length === 0) return [];
  const normalized = files.map(normalizeSubmissionFile);
  if (normalized.every((file) => file.mimeType.startsWith('image/'))) {
    return uploadLocalFiles(`submissions/${userId}/${applicationId}/attachments`, normalized);
  }
  return uploadSubmissionDocuments(normalized);
}

export function normalizeSubmissionLinks(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter((part) => /^https?:\/\//i.test(part))
    .slice(0, 5);
}

export function findOversizedSubmissionFiles(files: SubmissionFile[]): SubmissionFile | undefined {
  return files.find((file) => typeof file.size === 'number' && file.size > MAX_SUBMISSION_FILE_BYTES);
}

export function parseLinkInput(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (/^https?:\/\//i.test(trimmed)) return [trimmed];
  return normalizeSubmissionLinks(trimmed);
}
