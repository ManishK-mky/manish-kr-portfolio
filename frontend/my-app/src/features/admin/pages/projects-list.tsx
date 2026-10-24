'use client';

import { ExternalLink, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import type { Paginated, Project } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { moveItem, ReorderButtons } from '../components/reorder';
import { useApiQuery, useMutation } from '../hooks/use-api';
import { thumb } from '../media/upload';

type StatusFilter = 'all' | 'published' | 'draft';

export function ProjectsListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const { data, setData, error, loading, reload } = useApiQuery<Paginated<Project>>('/projects/admin', {
    page,
    limit: 50,
    search: search.trim() || undefined,
    status,
  });
  const { pending, run } = useMutation();
  const items = data?.items ?? [];
  // Reordering only makes sense on the complete, unfiltered list.
  const canReorder = !search && status === 'all' && (data?.meta.totalPages ?? 1) === 1;

  const patchItem = (id: string, patch: Partial<Project>) =>
    setData((d) => (d ? { ...d, items: d.items.map((p) => (p.id === id ? { ...p, ...patch } : p)) } : d));

  return (
    <>
      <PageHeader
        title="Projects"
        description="Drafts stay private until published."
        actions={
          <Link href="/admin/projects/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" /> New project
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects"
            aria-label="Search projects"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Filter by status">
          {(['all', 'published', 'draft'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={cn('rounded-md px-3 py-1 text-sm capitalize text-muted-foreground', status === s && 'bg-accent text-foreground')}
            >
              {s === 'draft' ? 'Drafts' : s}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState
          title={search || status !== 'all' ? 'No matching projects' : 'No projects yet'}
          action={
            <Link href="/admin/projects/new" className={buttonVariants({ size: 'sm' })}>
              Create your first project
            </Link>
          }
        />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              {canReorder && (
                <ReorderButtons
                  index={i}
                  count={items.length}
                  label={p.title}
                  disabled={pending}
                  onMove={async (from, to) => {
                    const next = moveItem(items, from, to);
                    setData((d) => (d ? { ...d, items: next } : d));
                    const ok = await run(() => api('/projects/reorder', { method: 'PATCH', body: { ids: next.map((x) => x.id) } }));
                    if (!ok) void reload();
                  }}
                />
              )}
              <div className="h-11 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
                {p.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(p.cover.url, 128)} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/projects/${p.id}`} className="block truncate text-sm font-medium hover:underline">
                  {p.title}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{p.category || 'Uncategorised'} · /{p.slug}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={p.featured}
                aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`}
                onClick={async () => {
                  const ok = await run(() => api(`/projects/${p.id}`, { method: 'PATCH', body: { featured: !p.featured } }));
                  if (ok) patchItem(p.id, { featured: !p.featured });
                }}
              >
                <Star className={cn(p.featured && 'fill-brand text-brand')} />
              </Button>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={p.published}
                  aria-label={p.published ? `Unpublish ${p.title}` : `Publish ${p.title}`}
                  onCheckedChange={async (published) => {
                    const ok = await run(
                      () => api(`/projects/${p.id}/status`, { method: 'PATCH', body: { published } }),
                      { success: published ? 'Project published' : 'Project unpublished' },
                    );
                    if (ok) patchItem(p.id, { published });
                  }}
                />
                <span className="hidden w-16 sm:inline">{p.published ? 'Published' : 'Draft'}</span>
              </label>
              {p.published && (
                <a
                  href={`/projects/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                  aria-label={`View ${p.title} on the site`}
                >
                  <ExternalLink />
                </a>
              )}
              <Link href={`/admin/projects/${p.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label={`Edit ${p.title}`}>
                <Pencil />
              </Link>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${p.title}`}
                title="Delete this project?"
                description={`“${p.title}” will be permanently deleted. Its images stay in the media library.`}
                onConfirm={async () => {
                  const ok = await run(() => api(`/projects/${p.id}`, { method: 'DELETE' }), { success: 'Project deleted' });
                  if (ok) void reload();
                }}
              >
                <Trash2 />
              </ConfirmButton>
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
    </>
  );
}
