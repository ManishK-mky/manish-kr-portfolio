'use client';

import { Copy, FileText, Search, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api, errorMessage } from '@/lib/api/client';
import { formatBytes, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MEDIA_FOLDERS, type MediaAsset, type MediaFolder, type Paginated } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { SelectField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader, Spinner } from '../components/page-header';
import { useApiQuery, useMutation } from '../hooks/use-api';
import { thumb, uploadFile } from '../media/upload';

export function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState<MediaFolder | ''>('');
  const [page, setPage] = useState(1);
  const [uploadFolder, setUploadFolder] = useState<MediaFolder>('site');
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data, error, loading, reload } = useApiQuery<Paginated<MediaAsset>>('/media', {
    page,
    limit: 30,
    search: search.trim() || undefined,
    folder: folder || undefined,
  });
  const items = data?.items ?? [];

  async function onFiles(files: FileList) {
    for (const file of Array.from(files)) {
      setUploading({ name: file.name, pct: 0 });
      try {
        const kind = file.type === 'application/pdf' ? 'document' : 'image';
        await uploadFile(file, {
          folder: kind === 'document' ? 'documents' : uploadFolder,
          kind,
          onProgress: (pct) => setUploading({ name: file.name, pct }),
        });
        toast.success(`Uploaded ${file.name}`);
      } catch (err) {
        toast.error(`Could not upload ${file.name}`, { description: errorMessage(err) });
      }
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = '';
    void reload();
  }

  return (
    <>
      <PageHeader
        title="Media library"
        description="Files are stored in Cloudinary. Assets still in use can’t be deleted."
        actions={
          <>
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value as MediaFolder)}
              aria-label="Upload folder"
              className="h-8 rounded-lg border bg-transparent px-2 text-sm"
            >
              {MEDIA_FOLDERS.filter((f) => f !== 'documents').map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={Boolean(uploading)}>
              {uploading ? <Spinner /> : <Upload data-icon="inline-start" />}
              {uploading ? `${uploading.pct}%` : 'Upload'}
            </Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search media"
            aria-label="Search media"
            className="h-9 pl-8"
          />
        </div>
        <SelectField
          label="Folder"
          className="sm:w-44"
          value={folder}
          placeholder="All folders"
          options={MEDIA_FOLDERS.map((f) => ({ value: f, label: f }))}
          onChange={(f) => {
            setFolder(f);
            setPage(1);
          }}
        />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="No media yet" description="Upload images here or from any image field." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="group block w-full overflow-hidden rounded-lg border bg-card text-left focus-visible:ring-3 focus-visible:ring-ring"
              >
                <div className="aspect-square bg-muted">
                  {a.resourceType === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb(a.url, 300)} alt={a.alt || a.originalFilename} className="size-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <FileText className="size-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-xs font-medium">{a.originalFilename || a.publicId}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {a.folder} · {formatBytes(a.bytes)}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button variant="outline" size="sm" disabled={!data.meta.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={!data.meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {selected && <AssetDialog asset={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

function AssetDialog({ asset, onClose, onChanged }: { asset: MediaAsset; onClose: () => void; onChanged: () => void }) {
  const { data: detail } = useApiQuery<MediaAsset>(`/media/${asset.id}`);
  const [alt, setAlt] = useState(asset.alt);
  const { pending, run } = useMutation();
  const usages = detail?.usages ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="truncate">{asset.originalFilename || asset.publicId}</DialogTitle>
          <DialogDescription>
            {asset.folder} · {formatBytes(asset.bytes)}
            {asset.width && ` · ${asset.width}×${asset.height}`} · {formatDate(asset.createdAt)}
          </DialogDescription>
        </DialogHeader>
        {asset.resourceType === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb(asset.url, 900)} alt={alt || ''} className="max-h-72 w-full rounded-lg border bg-muted object-contain" />
        )}
        <div className="space-y-2">
          <label htmlFor="asset-alt" className="text-[0.8rem] font-medium">
            Default alt text
          </label>
          <div className="flex gap-2">
            <Input id="asset-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} className="h-9" />
            <Button
              variant="outline"
              disabled={pending || alt === asset.alt}
              onClick={async () => {
                const ok = await run(() => api(`/media/${asset.id}`, { method: 'PATCH', body: { alt } }), { success: 'Alt text saved' });
                if (ok) onChanged();
              }}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p className="mb-1 font-medium">Used by</p>
          {!detail ? (
            <Spinner />
          ) : usages.length === 0 ? (
            <p className="text-muted-foreground">Not used anywhere — safe to delete.</p>
          ) : (
            <ul className="text-muted-foreground">
              {usages.map((u) => (
                <li key={u.source}>
                  {u.source} ({u.count})
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(asset.url);
                toast.success('URL copied');
              } catch {
                toast.error('Could not copy');
              }
            }}
          >
            <Copy data-icon="inline-start" /> Copy URL
          </Button>
          <ConfirmButton
            size="default"
            title="Delete this file?"
            description="It will be removed from Cloudinary permanently."
            onConfirm={async () => {
              const ok = await run(() => api(`/media/${asset.id}`, { method: 'DELETE' }), { success: 'File deleted', error: 'Could not delete' });
              if (ok) {
                onChanged();
                onClose();
              }
            }}
          >
            <span className={cn('inline-flex items-center gap-1.5', usages.length > 0 && 'opacity-80')}>
              <Trash2 className="size-4" /> Delete
            </span>
          </ConfirmButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
