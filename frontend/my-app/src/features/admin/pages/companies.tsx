'use client';

import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fieldErrors } from '@/lib/validation';
import type { Company, ImageRef } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { TextAreaField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { useCrud } from '../hooks/use-crud';
import { ImageField, imagePayload } from '../media/image-field';
import { thumb } from '../media/upload';

const optionalUrl = z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Enter a full URL' })]);
export const companySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  website: optionalUrl,
});

interface Draft {
  name: string;
  logo: ImageRef | null;
  website: string;
  location: string;
  industry: string;
  description: string;
}
const EMPTY: Draft = { name: '', logo: null, website: '', location: '', industry: '', description: '' };

export function CompaniesPage() {
  const crud = useCrud<Company>('/companies', { entity: 'Company' });
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const items = (crud.data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const setDraft = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  return (
    <>
      <PageHeader
        title="Companies"
        description="Reusable across every position you held there."
        actions={
          <Button
            onClick={() => {
              setErrors({});
              setEditing({ id: null, draft: EMPTY });
            }}
          >
            <Plus data-icon="inline-start" /> Add company
          </Button>
        }
      />
      <div className="relative mb-4 max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies" className="h-9 pl-8" aria-label="Search companies" />
      </div>
      {crud.error ? (
        <ErrorState message={crud.error} onRetry={crud.reload} />
      ) : crud.loading && !crud.data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title={search ? 'No matches' : 'No companies yet'} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <div className="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                {c.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb(c.logo.url, 80)} alt="" className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[c.industry, c.location].filter(Boolean).join(' · ') || '—'}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${c.name}`}
                onClick={() => {
                  setErrors({});
                  setEditing({ id: c.id, draft: { name: c.name, logo: c.logo, website: c.website, location: c.location, industry: c.industry, description: c.description } });
                }}
              >
                <Pencil />
              </Button>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${c.name}`}
                title={`Delete ${c.name}?`}
                description="Companies still used by experience records can't be deleted."
                onConfirm={() => crud.remove(c.id)}
              >
                <Trash2 />
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={editing.id ? 'Edit company' : 'Add company'}
          pending={crud.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(companySchema, editing.draft);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            return Boolean(await crud.save(editing.id, { ...editing.draft, logo: imagePayload(editing.draft.logo) }));
          }}
        >
          <TextField label="Name" required value={editing.draft.name} onChange={(name) => setDraft({ name })} error={errors.name} />
          <ImageField label="Logo" folder="companies" aspect="aspect-square" value={editing.draft.logo} onChange={(logo) => setDraft({ logo })} />
          <TextField label="Website" value={editing.draft.website} onChange={(website) => setDraft({ website })} error={errors.website} placeholder="https://" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Location" value={editing.draft.location} onChange={(location) => setDraft({ location })} />
            <TextField label="Industry" value={editing.draft.industry} onChange={(industry) => setDraft({ industry })} />
          </div>
          <TextAreaField label="Description" rows={3} maxLength={600} value={editing.draft.description} onChange={(description) => setDraft({ description })} />
        </EditDialog>
      )}
    </>
  );
}
