'use client';

import { ArrowLeft, ExternalLink, ImagePlus, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { slugify, toDateInput } from '@/lib/format';
import { fieldErrors } from '@/lib/validation';
import type { ChallengeSolution, GalleryImage, ImageRef, Project } from '@/types/api';
import { FormSection, ListField, SwitchField, TagInput, TextAreaField, TextField } from '../components/fields';
import { ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { moveItem, ReorderButtons } from '../components/reorder';
import { SaveBar } from '../components/save-bar';
import { useApiQuery, useMutation, useUnsavedChanges } from '../hooks/use-api';
import { assetToImageRef, ImageField, imagePayload } from '../media/image-field';
import { MediaPicker } from '../media/media-picker';
import { thumb } from '../media/upload';

const optionalUrl = z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Enter a full URL starting with https://' })]);

export const projectSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(140),
    slug: z.union([z.literal(''), z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only').max(100)]),
    summary: z.string().trim().min(1, 'A short description is required').max(300),
    githubUrl: optionalUrl,
    liveUrl: optionalUrl,
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'Completion must be after the start date',
  });

interface Draft {
  title: string;
  slug: string;
  summary: string;
  description: string;
  cover: ImageRef | null;
  gallery: GalleryImage[];
  technologies: string[];
  category: string;
  githubUrl: string;
  liveUrl: string;
  startDate: string;
  endDate: string;
  role: string;
  responsibilities: string[];
  challenges: ChallengeSolution[];
  features: string[];
  achievements: string[];
  featured: boolean;
  published: boolean;
}

const EMPTY: Draft = {
  title: '', slug: '', summary: '', description: '', cover: null, gallery: [], technologies: [], category: '',
  githubUrl: '', liveUrl: '', startDate: '', endDate: '', role: '', responsibilities: [], challenges: [],
  features: [], achievements: [], featured: false, published: false,
};

function toDraft(p: Project): Draft {
  return {
    title: p.title, slug: p.slug, summary: p.summary, description: p.description ?? '', cover: p.cover,
    gallery: p.gallery ?? [], technologies: p.technologies, category: p.category, githubUrl: p.githubUrl,
    liveUrl: p.liveUrl, startDate: toDateInput(p.startDate), endDate: toDateInput(p.endDate), role: p.role,
    responsibilities: p.responsibilities ?? [], challenges: p.challenges ?? [], features: p.features ?? [],
    achievements: p.achievements, featured: p.featured, published: p.published,
  };
}

export function ProjectEditorPage({ id }: { id: string | null }) {
  const { data, error, loading, reload } = useApiQuery<Project>(id ? `/projects/admin/${id}` : null);
  if (!id) return <ProjectForm id={null} initial={EMPTY} />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingRows rows={8} />;
  return <ProjectForm id={id} initial={toDraft(data)} />;
}

function ProjectForm({ id, initial }: { id: string | null; initial: Draft }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [galleryPicker, setGalleryPicker] = useState(false);
  const { pending, run } = useMutation();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function save() {
    const { errors: errs } = fieldErrors(projectSchema, values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const body = {
      ...values,
      slug: values.slug || undefined,
      cover: imagePayload(values.cover),
      gallery: values.gallery.map((g) => ({ mediaId: g.mediaId, alt: g.alt, caption: g.caption })),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      challenges: values.challenges.filter((c) => c.challenge.trim() && c.solution.trim()),
    };
    const result = await run(
      () => api<Project>(id ? `/projects/${id}` : '/projects', { method: id ? 'PATCH' : 'POST', body }),
      { success: id ? 'Project saved' : 'Project created' },
    );
    if (!result) return;
    const next = toDraft(result);
    setValues(next);
    setSaved(next);
    if (!id) router.replace(`/admin/projects/${result.id}`);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
    >
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Projects
      </Link>
      <PageHeader
        title={id ? values.title || 'Untitled project' : 'New project'}
        actions={
          id && saved.published ? (
            <a href={`/projects/${saved.slug}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              View on site <ExternalLink data-icon="inline-end" />
            </a>
          ) : undefined
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <FormSection title="Basics">
            <TextField
              label="Title"
              required
              value={values.title}
              error={errors.title}
              onChange={(title) => setValues((s) => ({ ...s, title, slug: slugTouched ? s.slug : slugify(title) }))}
            />
            <TextField
              label="URL slug"
              value={values.slug}
              error={errors.slug}
              hint={`/projects/${values.slug || 'generated-from-title'}`}
              onChange={(slug) => {
                setSlugTouched(true);
                set('slug', slug.toLowerCase());
              }}
            />
            <TextAreaField label="Short description" required rows={2} maxLength={300} value={values.summary} onChange={(v) => set('summary', v)} error={errors.summary} />
            <TextAreaField label="Detailed description" rows={8} maxLength={20000} value={values.description} onChange={(v) => set('description', v)} hint="Separate paragraphs with a blank line." />
          </FormSection>

          <FormSection title="Images">
            <ImageField label="Cover image" folder="projects" value={values.cover} onChange={(v) => set('cover', v)} hint="16:9 or wider looks best." />
            <div>
              <p className="mb-2 text-[0.8rem] font-medium">Gallery</p>
              {values.gallery.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {values.gallery.map((g, i) => (
                    <li key={`${g.mediaId}-${i}`} className="flex items-start gap-3 rounded-lg border p-2">
                      <ReorderButtons index={i} count={values.gallery.length} label={`image ${i + 1}`} onMove={(f, t) => set('gallery', moveItem(values.gallery, f, t))} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb(g.url, 160)} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={g.alt}
                          placeholder="Alt text"
                          aria-label={`Image ${i + 1} alt text`}
                          className="h-8 text-xs"
                          onChange={(e) => set('gallery', values.gallery.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                        />
                        <Input
                          value={g.caption}
                          placeholder="Caption (optional)"
                          aria-label={`Image ${i + 1} caption`}
                          className="h-8 text-xs"
                          onChange={(e) => set('gallery', values.gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove image ${i + 1}`} onClick={() => set('gallery', values.gallery.filter((_, j) => j !== i))}>
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setGalleryPicker(true)}>
                <ImagePlus data-icon="inline-start" /> Add image
              </Button>
              <MediaPicker
                open={galleryPicker}
                onOpenChange={setGalleryPicker}
                folder="projects"
                onSelect={(asset) => set('gallery', [...values.gallery, { ...assetToImageRef(asset), caption: '' }])}
              />
            </div>
          </FormSection>

          <FormSection title="Case study" description="Optional sections shown on the project page.">
            <TextField label="Your role" value={values.role} onChange={(v) => set('role', v)} />
            <ListField label="Responsibilities" value={values.responsibilities} onChange={(v) => set('responsibilities', v)} />
            <ListField label="Features" value={values.features} onChange={(v) => set('features', v)} />
            <ListField label="Achievements & measurable impact" value={values.achievements} onChange={(v) => set('achievements', v)} />
            <div>
              <p className="mb-2 text-[0.8rem] font-medium">Challenges & solutions</p>
              <ul className="space-y-3">
                {values.challenges.map((c, i) => (
                  <li key={i} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                      <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove challenge ${i + 1}`} onClick={() => set('challenges', values.challenges.filter((_, j) => j !== i))}>
                        <Trash2 />
                      </Button>
                    </div>
                    <TextAreaField label="Challenge" rows={2} maxLength={1000} value={c.challenge} onChange={(v) => set('challenges', values.challenges.map((x, j) => (j === i ? { ...x, challenge: v } : x)))} />
                    <TextAreaField label="Solution" rows={3} maxLength={2000} value={c.solution} onChange={(v) => set('challenges', values.challenges.map((x, j) => (j === i ? { ...x, solution: v } : x)))} />
                  </li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => set('challenges', [...values.challenges, { challenge: '', solution: '' }])}>
                <Plus data-icon="inline-start" /> Add challenge
              </Button>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Publishing">
            <SwitchField label="Published" description="Visible on the public site." checked={values.published} onChange={(v) => set('published', v)} />
            <SwitchField label="Featured" description="Shown on the home page." checked={values.featured} onChange={(v) => set('featured', v)} />
          </FormSection>
          <FormSection title="Details">
            <TextField label="Category" value={values.category} onChange={(v) => set('category', v)} placeholder="Product, Open source…" />
            <TagInput label="Technologies & skills" value={values.technologies} onChange={(v) => set('technologies', v)} />
            <TextField label="Live demo URL" value={values.liveUrl} onChange={(v) => set('liveUrl', v)} error={errors.liveUrl} placeholder="https://" />
            <TextField label="GitHub URL" value={values.githubUrl} onChange={(v) => set('githubUrl', v)} error={errors.githubUrl} placeholder="https://github.com/…" />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Started" type="date" value={values.startDate} onChange={(v) => set('startDate', v)} />
              <TextField label="Completed" type="date" value={values.endDate} onChange={(v) => set('endDate', v)} error={errors.endDate} />
            </div>
          </FormSection>
        </div>
      </div>
      <SaveBar dirty={dirty || !id} pending={pending} label={id ? 'Save project' : 'Create project'} />
    </form>
  );
}
