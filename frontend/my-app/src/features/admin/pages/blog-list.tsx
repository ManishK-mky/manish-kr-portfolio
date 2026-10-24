'use client';

import { ExternalLink, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Paginated, PostStatus, PostSummary } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EmptyState, ErrorState, LoadingRows, PageHeader, StatusBadge } from '../components/page-header';
import { useApiQuery, useMutation } from '../hooks/use-api';

const FILTERS: { value: PostStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
];

export function BlogListPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PostStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const { data, error, loading, reload, setData } = useApiQuery<Paginated<PostSummary>>('/blog/admin', {
    page,
    limit: 20,
    search: search.trim() || undefined,
    status,
  });
  const { run } = useMutation();
  const items = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Blog posts"
        description="Drafts and scheduled posts are never visible publicly."
        actions={
          <Link href="/admin/blog/new" className={buttonVariants()}>
            <Plus data-icon="inline-start" /> New post
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
            placeholder="Search title and content"
            aria-label="Search posts"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={status === f.value}
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={cn('rounded-md px-3 py-1 text-sm text-muted-foreground', status === f.value && 'bg-accent text-foreground')}
            >
              {f.label}
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
          title={search || status !== 'all' ? 'No matching posts' : 'No posts yet'}
          action={
            <Link href="/admin/blog/new" className={buttonVariants({ size: 'sm' })}>
              Write your first post
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Category</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Date</th>
                <th className="px-4 py-2.5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((p) => (
                <tr key={p.id} className="hover:bg-accent/30">
                  <td className="max-w-xs px-4 py-2.5">
                    <Link href={`/admin/blog/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                      {p.featured && <Star className="size-3.5 shrink-0 fill-brand text-brand" aria-label="Featured" />}
                      <span className="truncate">{p.title}</span>
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="hidden px-4 py-2.5 text-muted-foreground md:table-cell">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="hidden px-4 py-2.5 whitespace-nowrap text-muted-foreground sm:table-cell">
                    {p.status === 'draft' ? `Edited ${formatDate(p.updatedAt)}` : formatDate(p.publishedAt)}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex justify-end">
                      {p.status === 'published' && (
                        <a
                          href={`/blog/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                          aria-label={`View ${p.title}`}
                        >
                          <ExternalLink />
                        </a>
                      )}
                      <Link href={`/admin/blog/${p.id}`} className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })} aria-label={`Edit ${p.title}`}>
                        <Pencil />
                      </Link>
                      <ConfirmButton
                        variant="ghost"
                        size="icon-sm"
                        ariaLabel={`Delete ${p.title}`}
                        title="Delete this post?"
                        description={`“${p.title}” will be permanently deleted.`}
                        onConfirm={async () => {
                          const ok = await run(() => api(`/blog/${p.id}`, { method: 'DELETE' }), { success: 'Post deleted' });
                          if (ok) setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== p.id) } : d));
                        }}
                      >
                        <Trash2 />
                      </ConfirmButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
