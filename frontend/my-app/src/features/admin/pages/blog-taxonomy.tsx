'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { fieldErrors } from '@/lib/validation';
import type { Taxonomy } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { TextAreaField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { useCrud } from '../hooks/use-crud';

const schema = z.object({ name: z.string().trim().min(1, 'Name is required').max(60) });

function TaxonomyPanel({ kind }: { kind: 'categories' | 'tags' }) {
  const singular = kind === 'categories' ? 'Category' : 'Tag';
  const crud = useCrud<Taxonomy>(`/blog/${kind}`, { listPath: `/blog/${kind}?all=true`, entity: singular });
  const [editing, setEditing] = useState<{ id: string | null; name: string; description: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const items = crud.data ?? [];

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="font-semibold tracking-tight">{kind === 'categories' ? 'Categories' : 'Tags'}</h2>
        <Button
          size="sm"
          onClick={() => {
            setErrors({});
            setEditing({ id: null, name: '', description: '' });
          }}
        >
          <Plus data-icon="inline-start" /> Add
        </Button>
      </div>
      {crud.error ? (
        <div className="p-4">
          <ErrorState message={crud.error} onRetry={crud.reload} />
        </div>
      ) : crud.loading && !crud.data ? (
        <div className="p-4">
          <LoadingRows rows={3} />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={`No ${kind} yet`} className="m-4" />
      ) : (
        <ul className="divide-y">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{t.slug} · {t.postCount ?? 0} published post{t.postCount === 1 ? '' : 's'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${t.name}`}
                onClick={() => {
                  setErrors({});
                  setEditing({ id: t.id, name: t.name, description: t.description ?? '' });
                }}
              >
                <Pencil />
              </Button>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${t.name}`}
                title={`Delete “${t.name}”?`}
                description={`Posts keep their content; the ${singular.toLowerCase()} is simply removed from them.`}
                onConfirm={() => crud.remove(t.id)}
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
          title={`${editing.id ? 'Edit' : 'Add'} ${singular.toLowerCase()}`}
          pending={crud.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(schema, editing);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            const payload = kind === 'categories' ? { name: editing.name, description: editing.description } : { name: editing.name };
            return Boolean(await crud.save(editing.id, payload));
          }}
        >
          <TextField label="Name" required value={editing.name} onChange={(name) => setEditing({ ...editing, name })} error={errors.name} />
          {kind === 'categories' && (
            <TextAreaField label="Description" rows={2} maxLength={300} value={editing.description} onChange={(description) => setEditing({ ...editing, description })} />
          )}
        </EditDialog>
      )}
    </section>
  );
}

export function BlogTaxonomyPage() {
  return (
    <>
      <PageHeader title="Categories & tags" description="Organise posts for filtering and related-article suggestions." />
      <div className="grid gap-6 lg:grid-cols-2">
        <TaxonomyPanel kind="categories" />
        <TaxonomyPanel kind="tags" />
      </div>
    </>
  );
}
