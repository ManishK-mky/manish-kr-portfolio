'use client';

import { FileText, ImageIcon, Images, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { ImageRef, MediaAsset, MediaFolder } from '@/types/api';
import { Spinner } from '../components/page-header';
import { MediaPicker } from './media-picker';
import { thumb, uploadFile } from './upload';

export function assetToImageRef(asset: MediaAsset, alt?: string): ImageRef {
  return {
    mediaId: asset.id,
    url: asset.url,
    publicId: asset.publicId,
    width: asset.width,
    height: asset.height,
    alt: alt ?? asset.alt ?? '',
  };
}

/** API payload for an image slot: only the id and alt text are sent. */
export const imagePayload = (img: ImageRef | null) => (img ? { mediaId: img.mediaId, alt: img.alt } : null);

/**
 * Image slot: upload, pick from the library, replace, remove and edit alt
 * text. Replacing or removing never deletes the asset itself — that happens
 * in the media library, which refuses while an asset is still referenced.
 */
export function ImageField({
  label,
  value,
  onChange,
  folder,
  aspect = 'aspect-video',
  hint,
  withAlt = true,
}: {
  label: string;
  value: ImageRef | null;
  onChange: (img: ImageRef | null) => void;
  folder: MediaFolder;
  aspect?: string;
  hint?: string;
  withAlt?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setProgress(0);
    try {
      const asset = await uploadFile(file, { folder, alt: value?.alt, onProgress: setProgress });
      onChange(assetToImageRef(asset, value?.alt));
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed', { description: errorMessage(err) });
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-[0.8rem]">{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            'relative w-full shrink-0 overflow-hidden rounded-lg border bg-muted sm:w-44',
            aspect,
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumb(value.url, 480)} alt={value.alt || 'Selected image'} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
          )}
          {progress !== null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 text-xs">
              <Spinner />
              {progress}%
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button type="button" size="sm" variant="outline" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
              <Upload data-icon="inline-start" />
              {value ? 'Replace' : 'Upload'}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
              <Images data-icon="inline-start" />
              Library
            </Button>
            {value && (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                <Trash2 data-icon="inline-start" />
                Remove
              </Button>
            )}
          </div>
          {value && withAlt && (
            <Input
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Alt text — describe the image for screen readers"
              aria-label={`${label} alt text`}
              maxLength={300}
              className="h-8 text-xs"
            />
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder={folder}
        onSelect={(asset) => onChange(assetToImageRef(asset, value?.alt))}
      />
    </div>
  );
}

/** PDF slot (e.g. the downloadable CV). */
export function DocumentField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { mediaId: string; url: string; filename: string } | null;
  onChange: (doc: { mediaId: string; url: string; filename: string } | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toDoc = (a: MediaAsset) => ({ mediaId: a.id, url: a.url, filename: a.originalFilename });

  return (
    <div className="space-y-2">
      <Label className="text-[0.8rem]">{label}</Label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <FileText className="size-4 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">
          {value ? (
            <a href={value.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
              {value.filename || 'Document'}.pdf
            </a>
          ) : (
            <span className="text-muted-foreground">No file</span>
          )}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setProgress(0);
            try {
              onChange(toDoc(await uploadFile(file, { folder: 'documents', kind: 'document', onProgress: setProgress })));
              toast.success('File uploaded');
            } catch (err) {
              toast.error('Upload failed', { description: errorMessage(err) });
            } finally {
              setProgress(null);
              e.target.value = '';
            }
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
          {progress !== null ? <Spinner /> : <Upload data-icon="inline-start" />}
          {progress !== null ? `${progress}%` : value ? 'Replace' : 'Upload PDF'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
          Library
        </Button>
        {value && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} aria-label="Remove file">
            <Trash2 />
          </Button>
        )}
      </div>
      <MediaPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        folder="documents"
        kind="document"
        onSelect={(a) => onChange(toDoc(a))}
      />
    </div>
  );
}
