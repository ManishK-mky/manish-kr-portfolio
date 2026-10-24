'use client';

import { Mail, MailOpen, Reply, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ContactMessage, Paginated } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EmptyState, ErrorState, LoadingRows, PageHeader, StatusBadge } from '../components/page-header';
import { useApiQuery, useMutation } from '../hooks/use-api';

export function MessagesPage() {
  const [status, setStatus] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, setData, error, loading, reload } = useApiQuery<Paginated<ContactMessage>>('/contact', {
    page,
    limit: 20,
    status,
    search: search.trim() || undefined,
  });
  const { run } = useMutation();
  const items = data?.items ?? [];

  const setRead = async (m: ContactMessage, read: boolean) => {
    const ok = await run(() => api(`/contact/${m.id}`, { method: 'PATCH', body: { read } }));
    if (ok) setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === m.id ? { ...x, read } : x)) } : d));
  };

  return (
    <>
      <PageHeader title="Messages" description="Submissions from the contact form." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search messages"
            aria-label="Search messages"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex gap-1 rounded-lg border bg-card p-1" role="group" aria-label="Filter">
          {(['all', 'unread', 'read'] as const).map((s) => (
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
              {s}
            </button>
          ))}
        </div>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="No messages" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((m) => {
            const open = openId === m.id;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => {
                    setOpenId(open ? null : m.id);
                    if (!m.read && !open) void setRead(m, true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/40"
                >
                  {m.read ? <MailOpen className="size-4 text-muted-foreground" /> : <Mail className="size-4 text-brand" />}
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm', !m.read && 'font-semibold')}>
                      {m.name} <span className="font-normal text-muted-foreground">&lt;{m.email}&gt;</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{m.subject || m.message}</p>
                  </div>
                  {!m.read && <StatusBadge status="unread" />}
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(m.createdAt)}</span>
                </button>
                {open && (
                  <div className="space-y-4 border-t bg-subtle px-4 py-4">
                    {m.subject && <p className="text-sm font-medium">{m.subject}</p>}
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your message'}`)}`}
                        className={buttonVariants({ size: 'sm' })}
                      >
                        <Reply data-icon="inline-start" /> Reply by email
                      </a>
                      <Button size="sm" variant="outline" onClick={() => setRead(m, !m.read)}>
                        Mark as {m.read ? 'unread' : 'read'}
                      </Button>
                      <ConfirmButton
                        title="Delete this message?"
                        description="This can't be undone."
                        onConfirm={async () => {
                          const ok = await run(() => api(`/contact/${m.id}`, { method: 'DELETE' }), { success: 'Message deleted' });
                          if (ok) setData((d) => (d ? { ...d, items: d.items.filter((x) => x.id !== m.id) } : d));
                        }}
                      >
                        <Trash2 data-icon="inline-start" /> Delete
                      </ConfirmButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
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
