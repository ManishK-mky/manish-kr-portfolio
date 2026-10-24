'use client';

import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fieldErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { PROFICIENCY_LEVELS, type Proficiency, type Skill, type SkillCategory } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { SelectField, SwitchField, TextAreaField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { ReorderButtons } from '../components/reorder';
import { useCrud } from '../hooks/use-crud';

const skillSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  category: z.string().min(1, 'Choose a category'),
});
const categorySchema = z.object({ name: z.string().trim().min(1, 'Name is required').max(80) });

interface SkillDraft {
  name: string;
  category: string;
  icon: string;
  proficiency: Proficiency | '';
  featured: boolean;
}

const categoryId = (s: Skill) => (typeof s.category === 'string' ? s.category : s.category.id);

export function SkillsPage() {
  const skills = useCrud<Skill>('/skills', { entity: 'Skill' });
  const categories = useCrud<SkillCategory>('/skills/categories', { entity: 'Category' });
  const [skillEdit, setSkillEdit] = useState<{ id: string | null; draft: SkillDraft } | null>(null);
  const [catEdit, setCatEdit] = useState<{ id: string | null; name: string; description: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const cats = categories.data ?? [];
  const all = skills.data ?? [];
  const setDraft = (patch: Partial<SkillDraft>) => setSkillEdit((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  const openSkill = (s?: Skill, presetCategory?: string) => {
    setErrors({});
    setSkillEdit(
      s
        ? { id: s.id, draft: { name: s.name, category: categoryId(s), icon: s.icon, proficiency: s.proficiency ?? '', featured: s.featured } }
        : { id: null, draft: { name: '', category: presetCategory ?? cats[0]?.id ?? '', icon: '', proficiency: '', featured: false } },
    );
  };

  const loading = (skills.loading && !skills.data) || (categories.loading && !categories.data);
  const error = skills.error ?? categories.error;

  return (
    <>
      <PageHeader title="Skills" description="Grouped by category on the site. Avoids percentages — use an optional label instead." />
      {error ? (
        <ErrorState message={error} onRetry={() => { void skills.reload(); void categories.reload(); }} />
      ) : loading ? (
        <LoadingRows />
      ) : (
        <Tabs defaultValue="skills">
          <TabsList>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="skills" className="mt-6 space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => openSkill()} disabled={!cats.length}>
                <Plus data-icon="inline-start" /> Add skill
              </Button>
            </div>
            {cats.length === 0 && <EmptyState title="Create a category first" description="Use the Categories tab." />}
            {cats.map((cat) => {
              const items = all.filter((s) => categoryId(s) === cat.id);
              return (
                <section key={cat.id} className="rounded-xl border bg-card">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <h2 className="text-sm font-semibold">{cat.name}</h2>
                    <Button variant="ghost" size="sm" onClick={() => openSkill(undefined, cat.id)}>
                      <Plus data-icon="inline-start" /> Add
                    </Button>
                  </div>
                  {items.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground">No skills in this category.</p>
                  ) : (
                    <ul className="divide-y">
                      {items.map((s, i) => (
                        <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                          <ReorderButtons
                            index={i}
                            count={items.length}
                            label={s.name}
                            disabled={skills.pending}
                            onMove={(from, to) => {
                              // Reorder within the category, then persist the full list.
                              const others = all.filter((x) => categoryId(x) !== cat.id);
                              const moved = [...items];
                              const [m] = moved.splice(from, 1);
                              moved.splice(to, 0, m);
                              void skills.move([...moved, ...others], 0, 0);
                            }}
                          />
                          <span className="flex-1 text-sm">{s.name}</span>
                          {s.proficiency && <span className="font-mono text-xs text-muted-foreground">{s.proficiency}</span>}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={s.featured ? `Unfeature ${s.name}` : `Feature ${s.name}`}
                            aria-pressed={s.featured}
                            onClick={() => skills.save(s.id, { featured: !s.featured })}
                          >
                            <Star className={cn(s.featured && 'fill-brand text-brand')} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${s.name}`} onClick={() => openSkill(s)}>
                            <Pencil />
                          </Button>
                          <ConfirmButton
                            variant="ghost"
                            size="icon-sm"
                            ariaLabel={`Delete ${s.name}`}
                            title={`Delete ${s.name}?`}
                            description="The skill will be removed from the site."
                            onConfirm={() => skills.remove(s.id)}
                          >
                            <Trash2 />
                          </ConfirmButton>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </TabsContent>

          <TabsContent value="categories" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setErrors({});
                  setCatEdit({ id: null, name: '', description: '' });
                }}
              >
                <Plus data-icon="inline-start" /> Add category
              </Button>
            </div>
            <ul className="divide-y rounded-xl border bg-card">
              {cats.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <ReorderButtons index={i} count={cats.length} label={c.name} disabled={categories.pending} onMove={(f, t) => categories.move(cats, f, t)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{all.filter((s) => categoryId(s) === c.id).length} skills</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${c.name}`}
                    onClick={() => {
                      setErrors({});
                      setCatEdit({ id: c.id, name: c.name, description: c.description });
                    }}
                  >
                    <Pencil />
                  </Button>
                  <ConfirmButton
                    variant="ghost"
                    size="icon-sm"
                    ariaLabel={`Delete ${c.name}`}
                    title={`Delete ${c.name}?`}
                    description="Categories that still contain skills can't be deleted."
                    onConfirm={() => categories.remove(c.id)}
                  >
                    <Trash2 />
                  </ConfirmButton>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      )}

      {skillEdit && (
        <EditDialog
          open
          onOpenChange={(o) => !o && setSkillEdit(null)}
          title={skillEdit.id ? 'Edit skill' : 'Add skill'}
          pending={skills.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(skillSchema, skillEdit.draft);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            const d = skillEdit.draft;
            return Boolean(await skills.save(skillEdit.id, { ...d, proficiency: d.proficiency || null }));
          }}
        >
          <TextField label="Name" required value={skillEdit.draft.name} onChange={(name) => setDraft({ name })} error={errors.name} />
          <SelectField
            label="Category"
            required
            value={skillEdit.draft.category}
            options={cats.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(category) => setDraft({ category })}
            error={errors.category}
          />
          <SelectField
            label="Proficiency (optional)"
            value={skillEdit.draft.proficiency}
            placeholder="None"
            options={PROFICIENCY_LEVELS.map((p) => ({ value: p, label: p }))}
            onChange={(proficiency) => setDraft({ proficiency })}
          />
          <TextField label="Icon key (optional)" value={skillEdit.draft.icon} onChange={(icon) => setDraft({ icon })} hint="A short identifier such as “react” or “database”." />
          <SwitchField label="Featured" description="Highlighted as a core skill." checked={skillEdit.draft.featured} onChange={(featured) => setDraft({ featured })} />
        </EditDialog>
      )}

      {catEdit && (
        <EditDialog
          open
          onOpenChange={(o) => !o && setCatEdit(null)}
          title={catEdit.id ? 'Edit category' : 'Add category'}
          pending={categories.pending}
          onSubmit={async () => {
            const { errors: errs } = fieldErrors(categorySchema, catEdit);
            setErrors(errs);
            if (Object.keys(errs).length) return false;
            const ok = await categories.save(catEdit.id, { name: catEdit.name, description: catEdit.description });
            if (ok) await skills.reload();
            return Boolean(ok);
          }}
        >
          <TextField label="Name" required value={catEdit.name} onChange={(name) => setCatEdit({ ...catEdit, name })} error={errors.name} />
          <TextAreaField label="Description" rows={2} maxLength={300} value={catEdit.description} onChange={(description) => setCatEdit({ ...catEdit, description })} />
        </EditDialog>
      )}
    </>
  );
}
