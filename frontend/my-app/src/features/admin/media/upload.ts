'use client';

import { api, ApiError } from '@/lib/api/client';
import type { MediaAsset, MediaFolder, UploadSignature } from '@/types/api';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'];
export const DOCUMENT_TYPES = ['application/pdf'];
const MAX_BYTES = 10 * 1024 * 1024;

export type UploadKind = 'image' | 'document';

/** Client-side pre-check; the API re-validates the stored asset regardless. */
export function validateFile(file: File, kind: UploadKind): string | null {
  const allowed = kind === 'image' ? IMAGE_TYPES : DOCUMENT_TYPES;
  if (!allowed.includes(file.type)) {
    return kind === 'image' ? 'Choose a JPG, PNG, WebP, AVIF, GIF or SVG image.' : 'Choose a PDF file.';
  }
  if (file.size > MAX_BYTES) return 'Files must be 10 MB or smaller.';
  return null;
}

function postWithProgress(url: string, body: FormData, onProgress?: (pct: number) => void) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let json: Record<string, unknown> = {};
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(json);
      else {
        const message = (json.error as { message?: string } | undefined)?.message;
        reject(new Error(message ?? `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.send(body);
  });
}

/**
 * Signed direct upload:
 *   1. ask the API for a signature (admin-only, server holds the secret),
 *   2. upload the file straight to Cloudinary,
 *   3. register the result so the API verifies and stores its metadata.
 */
export async function uploadFile(
  file: File,
  opts: { folder: MediaFolder; kind?: UploadKind; alt?: string; onProgress?: (pct: number) => void },
): Promise<MediaAsset> {
  const kind = opts.kind ?? 'image';
  const problem = validateFile(file, kind);
  if (problem) throw new ApiError(400, problem);

  const sig = await api<UploadSignature>('/media/signature', {
    method: 'POST',
    body: { folder: opts.folder, kind },
  });
  if (file.size > sig.maxBytes) throw new ApiError(400, 'File is too large');

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('signature', sig.signature);
  form.append('folder', sig.folder);
  if (sig.allowed_formats) form.append('allowed_formats', sig.allowed_formats);

  const uploaded = await postWithProgress(sig.uploadUrl, form, opts.onProgress);
  return api<MediaAsset>('/media', {
    method: 'POST',
    body: {
      publicId: uploaded.public_id,
      resourceType: sig.resourceType,
      alt: opts.alt,
    },
  });
}

/** Small Cloudinary thumbnail URL for admin previews. */
export function thumb(url: string, width = 400) {
  return url.includes('/upload/') ? url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`) : url;
}
