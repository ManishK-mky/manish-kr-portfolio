'use client';

import { Check, Search, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api, errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { MediaAsset, MediaFolder, Paginated } from '@/types/api';
import { Spinner } from '../components/page-header';
import { thumb, uploadFile, type UploadKind } from './upload';

/** Browse the media library (or upload) and pick one asset. */
export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  folder,
  kind = 'image',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAsset) => void;
  folder: MediaFolder;
  kind?: UploadKind;
}) {
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resourceType = kind === 'image' ? 'image' : 'raw';

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api<Paginated<MediaAsset>>('/media', {
          query: { page, limit: 24, search, resourceType },
        });
        if (cancelled) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(res.meta.hasNextPage);
      } catch (err) {
        if (!cancelled) toast.error('Could not load media', { description: errorMessage(err) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, page, search, resourceType]);

  async function onFile(file: File) {
    setProgress(0);
    try {
      const asset = await uploadFile(file, { folder, kind, onProgress: setProgress });
      setItems((prev) => [asset, ...prev]);
      setSelected(asset);
      toast.success('Uploaded');
    } catch (err) {
      toast.error('Upload failed', { description: errorMessage(err) });
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
          <DialogDescription>Choose an existing {kind === 'image' ? 'image' : 'file'} or upload a new one.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by filename or alt text"
              className="h-9 pl-8"
              aria-label="Search media"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept={kind === 'image' ? 'image/*' : 'application/pdf'}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={progress !== null}>
            {progress !== null ? <Spinner /> : <Upload data-icon="inline-start" />}
            {progress !== null ? `Uploading ${progress}%` : 'Upload new'}
          </Button>
        </div>

        <div className="-mx-1 max-h-[50vh] overflow-y-auto px-1">
          {items.length === 0 && !loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No media yet — upload something.</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {items.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(asset)}
                    onDoubleClick={() => {
                      onSelect(asset);
                      onOpenChange(false);
                    }}
                    aria-pressed={selected?.id === asset.id}
                    className={cn(
                      'relative block aspect-square w-full overflow-hidden rounded-md border bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring',
                      selected?.id === asset.id && 'ring-2 ring-brand',
                    )}
                  >
                    {asset.resourceType === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb(asset.url, 240)} alt={asset.alt || asset.originalFilename} className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center p-2 text-center text-xs break-all">
                        {asset.originalFilename}.pdf
                      </span>
                    )}
                    {selected?.id === asset.id && (
                      <span className="absolute top-1 right-1 rounded-full bg-brand p-0.5 text-brand-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {loading && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {hasMore && !loading && (
            <div className="flex justify-center pt-4">
              <Button variant="ghost" size="sm" onClick={() => setPage((p) => p + 1)}>
                Load more
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) onSelect(selected);
              onOpenChange(false);
            }}
          >
            Use selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
