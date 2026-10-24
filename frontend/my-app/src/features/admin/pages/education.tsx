'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { formatRange, toDateInput } from '@/lib/format';
import { fieldErrors } from '@/lib/validation';
import type { Education, ImageRef } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { ListField, TagInput, TextAreaField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { ReorderButtons } from '../components/reorder';
import { useCrud } from '../hooks/use-crud';
import { ImageField, imagePayload } from '../media/image-field';

export const educationSchema = z
  .object({
    institution: z.string().trim().min(1, 'Institution is required').max(160),
    degree: z.string().trim().min(1, 'Degree is required').max(160),
    website: z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Enter a full URL' })]),
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'Graduation must be after the start date',
  });

interface Draft {
  institution: string;
  logo: ImageRef | null;
  website: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  grade: string;
  coursework: string[];
  achievements: string[];
  activities: string[];
  description: string;
}
const EMPTY: Draft = {
  institution: '', logo: null, website: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '',
  grade: '', coursework: [], achievements: [], activities: [], description: '',
};

export function EducationPage() {
  const crud = useCrud<Education>('/education', { entity: 'Education' });
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const items = crud.data ?? [];
  const setDraft = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const open = (e?: Education) => {
    setErrors({});
    setEditing(
      e
        ? {
            id: e.id,
            draft: {
              institution: e.institution, logo: e.logo, website: e.website, degree: e.degree, fieldOfStudy: e.fieldOfStudy,
              startDate: toDateInput(e.startDate), endDate: toDateInput(e.endDate), grade: e.grade,
              coursework: e.coursework, achievements: e.achievements, activities: e.activities, description: e.description,
            },
          }
        : { id: null, draft: EMPTY },
    );
  };

  return (
    <>
      <PageHeader
        title="Education"
        actions={
          <Button onClick={() => open()}>
            <Plus data-icon="inline-start" /> Add education
          </Button>
        }
      />
      {crud.error ? (
        <ErrorState message={crud.error} onRetry={crud.reload} />
      ) : crud.loading && !crud.data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="No education records yet" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 px-3 py-3">
              <ReorderButtons index={i} count={items.length} label={e.degree} disabled={crud.pending} onMove={(f, t) => crud.move(items, f, t)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {e.degree}
                  {e.fieldOfStudy && `, ${e.fieldOfStudy}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {e.institution} · {formatRange(e.startDate, e.endDate) || 'No dates'}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${e.degree}`} onClick={() => open(e)}>
                <Pencil />
              </Button>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${e.degree}`}
                title="Delete this record?"
                description={`${e.degree} at ${e.institution} will be removed.`}
                onConfirm={() => crud.remove(e.id)}
              >
                <Trash2 />
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditDialog
          wide
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={editing.id ? 'Edit education' : 'Add education'}
          pending={crud.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(educationSchema, editing.draft);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            const d = editing.draft;
            return Boolean(
              await crud.save(editing.id, {
                ...d,
                logo: imagePayload(d.logo),
                startDate: d.startDate || null,
                endDate: d.endDate || null,
              }),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Institution" required value={editing.draft.institution} onChange={(institution) => setDraft({ institution })} error={errors.institution} />
            <TextField label="Website" value={editing.draft.website} onChange={(website) => setDraft({ website })} error={errors.website} placeholder="https://" />
            <TextField label="Degree or qualification" required value={editing.draft.degree} onChange={(degree) => setDraft({ degree })} error={errors.degree} />
            <TextField label="Field of study" value={editing.draft.fieldOfStudy} onChange={(fieldOfStudy) => setDraft({ fieldOfStudy })} />
            <TextField label="Start date" type="date" value={editing.draft.startDate} onChange={(startDate) => setDraft({ startDate })} />
            <TextField label="Graduation date" type="date" value={editing.draft.endDate} onChange={(endDate) => setDraft({ endDate })} error={errors.endDate} />
            <TextField label="Grade or GPA" value={editing.draft.grade} onChange={(grade) => setDraft({ grade })} />
          </div>
          <ImageField label="Institution logo" folder="education" aspect="aspect-square" value={editing.draft.logo} onChange={(logo) => setDraft({ logo })} />
          <TextAreaField label="Description" rows={3} maxLength={2000} value={editing.draft.description} onChange={(description) => setDraft({ description })} />
          <TagInput label="Coursework" value={editing.draft.coursework} onChange={(coursework) => setDraft({ coursework })} />
          <ListField label="Achievements" rows={3} value={editing.draft.achievements} onChange={(achievements) => setDraft({ achievements })} />
          <ListField label="Activities" rows={3} value={editing.draft.activities} onChange={(activities) => setDraft({ activities })} />
        </EditDialog>
      )}
    </>
  );
}
