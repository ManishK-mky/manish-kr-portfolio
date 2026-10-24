'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { formatRange, toDateInput } from '@/lib/format';
import { fieldErrors } from '@/lib/validation';
import { EMPLOYMENT_TYPES, WORK_MODES, type Company, type Experience } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { ListField, SelectField, SwitchField, TagInput, TextAreaField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { ReorderButtons } from '../components/reorder';
import { useApiQuery } from '../hooks/use-api';
import { useCrud } from '../hooks/use-crud';

export const experienceSchema = z
  .object({
    company: z.string().min(1, 'Choose a company'),
    title: z.string().trim().min(1, 'Job title is required').max(120),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string(),
    current: z.boolean(),
  })
  .refine((v) => v.current || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'End date must be after the start date',
  });

interface Draft {
  company: string;
  title: string;
  employmentType: Experience['employmentType'];
  location: string;
  workMode: Experience['workMode'];
  startDate: string;
  endDate: string;
  current: boolean;
  summary: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

const EMPTY: Draft = {
  company: '',
  title: '',
  employmentType: 'full-time',
  location: '',
  workMode: 'onsite',
  startDate: '',
  endDate: '',
  current: false,
  summary: '',
  responsibilities: [],
  achievements: [],
  technologies: [],
};

const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

export function ExperiencePage() {
  const crud = useCrud<Experience>('/experience', { entity: 'Position' });
  const companies = useApiQuery<Company[]>('/companies');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const items = crud.data ?? [];
  const setDraft = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const open = (x?: Experience) => {
    setErrors({});
    setEditing(
      x
        ? {
            id: x.id,
            draft: {
              company: x.company?.id ?? '',
              title: x.title,
              employmentType: x.employmentType,
              location: x.location,
              workMode: x.workMode,
              startDate: toDateInput(x.startDate),
              endDate: toDateInput(x.endDate),
              current: x.current,
              summary: x.summary,
              responsibilities: x.responsibilities,
              achievements: x.achievements,
              technologies: x.technologies,
            },
          }
        : { id: null, draft: EMPTY },
    );
  };

  return (
    <>
      <PageHeader
        title="Experience"
        description="Positions in display order. Consecutive roles at one company are grouped on the site."
        actions={
          <Button onClick={() => open()} disabled={!companies.data?.length}>
            <Plus data-icon="inline-start" /> Add position
          </Button>
        }
      />
      {companies.data && companies.data.length === 0 && (
        <p className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm">
          Create a company first on the{' '}
          <Link href="/admin/companies" className="underline underline-offset-4">
            Companies
          </Link>{' '}
          page.
        </p>
      )}
      {crud.error ? (
        <ErrorState message={crud.error} onRetry={crud.reload} />
      ) : crud.loading && !crud.data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="No positions yet" />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((x, i) => (
            <li key={x.id} className="flex items-center gap-3 px-3 py-3">
              <ReorderButtons index={i} count={items.length} label={x.title} disabled={crud.pending} onMove={(f, t) => crud.move(items, f, t)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {x.title} <span className="text-muted-foreground">· {x.company?.name}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRange(x.startDate, x.endDate, x.current)} · {pretty(x.employmentType)} · {pretty(x.workMode)}
                </p>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${x.title}`} onClick={() => open(x)}>
                <Pencil />
              </Button>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${x.title}`}
                title="Delete this position?"
                description={`${x.title} at ${x.company?.name} will be removed.`}
                onConfirm={() => crud.remove(x.id)}
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
          title={editing.id ? 'Edit position' : 'Add position'}
          pending={crud.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(experienceSchema, editing.draft);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            const d = editing.draft;
            return Boolean(
              await crud.save(editing.id, {
                ...d,
                endDate: d.current || !d.endDate ? null : d.endDate,
              }),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Company"
              required
              value={editing.draft.company}
              placeholder="Choose…"
              options={(companies.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              onChange={(company) => setDraft({ company })}
              error={errors.company}
            />
            <TextField label="Job title" required value={editing.draft.title} onChange={(title) => setDraft({ title })} error={errors.title} />
            <SelectField
              label="Employment type"
              value={editing.draft.employmentType}
              options={EMPLOYMENT_TYPES.map((v) => ({ value: v, label: pretty(v) }))}
              onChange={(employmentType) => setDraft({ employmentType })}
            />
            <SelectField
              label="Work mode"
              value={editing.draft.workMode}
              options={WORK_MODES.map((v) => ({ value: v, label: pretty(v) }))}
              onChange={(workMode) => setDraft({ workMode })}
            />
            <TextField label="Location" value={editing.draft.location} onChange={(location) => setDraft({ location })} />
            <div />
            <TextField label="Start date" type="date" required value={editing.draft.startDate} onChange={(startDate) => setDraft({ startDate })} error={errors.startDate} />
            {!editing.draft.current && (
              <TextField label="End date" type="date" value={editing.draft.endDate} onChange={(endDate) => setDraft({ endDate })} error={errors.endDate} />
            )}
          </div>
          <SwitchField label="I currently work here" checked={editing.draft.current} onChange={(current) => setDraft({ current })} />
          <TextAreaField label="Summary" rows={2} maxLength={1000} value={editing.draft.summary} onChange={(summary) => setDraft({ summary })} />
          <ListField label="Responsibilities" value={editing.draft.responsibilities} onChange={(responsibilities) => setDraft({ responsibilities })} />
          <ListField label="Achievements" rows={3} value={editing.draft.achievements} onChange={(achievements) => setDraft({ achievements })} />
          <TagInput label="Technologies" value={editing.draft.technologies} onChange={(technologies) => setDraft({ technologies })} />
        </EditDialog>
      )}
    </>
  );
}
