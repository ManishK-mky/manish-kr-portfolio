'use client';

import { ArrowLeft, CalendarClock, Eye, EyeOff, Plus, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { formatDate, slugify, toDateTimeInput } from '@/lib/format';
import { fieldErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { ImageRef, Post, PostStatus, Taxonomy, TiptapDoc } from '@/types/api';
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from '../components/fields';
import { ErrorState, LoadingRows, PageHeader, Spinner, StatusBadge } from '../components/page-header';
import { RichTextEditor } from '../editor/rich-text-editor';
import { useApiQuery, useMutation, useUnsavedChanges } from '../hooks/use-api';
import { ImageField, imagePayload } from '../media/image-field';

export const PREVIEW_STORAGE_KEY = (id: string) => `post-preview:${id}`;

export const postSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  slug: z.union([z.literal(''), z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only').max(100)]),
  excerpt: z.string().max(400),
  seoTitle: z.string().max(70, 'Keep SEO titles under 70 characters'),
  seoDescription: z.string().max(170, 'Keep SEO descriptions under 170 characters'),
  canonicalUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Enter a full URL' })]),
});

interface Draft {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: ImageRef | null;
  content: TiptapDoc;
  category: string;
  tags: string[];
  featured: boolean;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
}

const EMPTY_DOC: TiptapDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
const EMPTY: Draft = {
  title: '', slug: '', excerpt: '', coverImage: null, content: EMPTY_DOC, category: '', tags: [],
  featured: false, authorName: '', seoTitle: '', seoDescription: '', canonicalUrl: '',
};

function toDraft(p: Post): Draft {
  return {
    title: p.title, slug: p.slug, excerpt: p.excerpt, coverImage: p.coverImage, content: p.content ?? EMPTY_DOC,
    category: p.category?.id ?? '', tags: p.tags.map((t) => t.id), featured: p.featured, authorName: p.author.name,
    seoTitle: p.seo.title, seoDescription: p.seo.description, canonicalUrl: p.seo.canonicalUrl,
  };
}

export function BlogEditorPage({ id }: { id: string | null }) {
  const post = useApiQuery<Post>(id ? `/blog/admin/${id}` : null);
  const categories = useApiQuery<Taxonomy[]>('/blog/categories', { all: true });
  const tags = useApiQuery<Taxonomy[]>('/blog/tags', { all: true });
  if (post.error) return <ErrorState message={post.error} onRetry={post.reload} />;
  if ((id && (!post.data || post.loading)) || !categories.data || !tags.data) return <LoadingRows rows={8} />;
  return (
    <PostForm
      id={id}
      post={post.data ?? null}
      categories={categories.data}
      tags={tags.data}
      onTagCreated={(t) => tags.setData((list) => [...(list ?? []), t])}
    />
  );
}

function PostForm({
  id,
  post,
  categories,
  tags,
  onTagCreated,
}: {
  id: string | null;
  post: Post | null;
  categories: Taxonomy[];
  tags: Taxonomy[];
  onTagCreated: (t: Taxonomy) => void;
}) {
  const router = useRouter();
  const initial = post ? toDraft(post) : EMPTY;
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [meta, setMeta] = useState<{ status: PostStatus; publishedAt: string | null; slug: string } | null>(
    post ? { status: post.status, publishedAt: post.publishedAt, slug: post.slug } : null,
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scheduleAt, setScheduleAt] = useState(post?.status === 'scheduled' ? toDateTimeInput(post.publishedAt) : '');
  const [newTag, setNewTag] = useState('');
  const { pending, run } = useMutation();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setValues((s) => ({ ...s, [k]: v }));

  const body = () => ({
    title: values.title,
    slug: values.slug || undefined,
    excerpt: values.excerpt,
    coverImage: imagePayload(values.coverImage),
    content: values.content,
    category: values.category || null,
    tags: values.tags,
    featured: values.featured,
    authorName: values.authorName || undefined,
    seo: { title: values.seoTitle, description: values.seoDescription, canonicalUrl: values.canonicalUrl },
  });

  /** Saves content; optionally changes publication status in the same request. */
  async function save(status?: PostStatus, publishedAt?: string | null) {
    const { errors: errs } = fieldErrors(postSchema, values);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
      return null;
    }
    const payload = { ...body(), ...(status ? { status } : {}), ...(publishedAt !== undefined ? { publishedAt } : {}) };
    const messages: Record<PostStatus, string> = {
      draft: meta?.status && meta.status !== 'draft' ? 'Post unpublished' : 'Draft saved',
      published: 'Post published',
      scheduled: 'Post scheduled',
    };
    const result = await run(
      () => api<Post>(id ? `/blog/${id}` : '/blog', { method: id ? 'PATCH' : 'POST', body: payload }),
      { success: status ? messages[status] : 'Changes saved' },
    );
    if (!result) return null;
    const next = toDraft(result);
    setValues(next);
    setSaved(next);
    setMeta({ status: result.status, publishedAt: result.publishedAt, slug: result.slug });
    if (!id) router.replace(`/admin/blog/${result.id}`);
    return result;
  }

  async function preview() {
    let postId = id;
    if (!postId) {
      const created = await save('draft');
      if (!created) return;
      postId = created.id;
    }
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY(postId), JSON.stringify(values.content));
    } catch {
      /* preview falls back to the saved version */
    }
    window.open(`/admin/blog/${postId}/preview`, '_blank', 'noopener');
  }

  async function createTag() {
    const name = newTag.trim();
    if (!name) return;
    const existing = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!values.tags.includes(existing.id)) set('tags', [...values.tags, existing.id]);
      setNewTag('');
      return;
    }
    const tag = await run(() => api<Taxonomy>('/blog/tags', { method: 'POST', body: { name } }), { success: `Tag “${name}” created` });
    if (tag) {
      onTagCreated(tag);
      set('tags', [...values.tags, tag.id]);
      setNewTag('');
    }
  }

  const status = meta?.status ?? 'draft';
  const publicUrl = meta && status === 'published' ? `/blog/${meta.slug}` : null;

  return (
    <div>
      <Link href="/admin/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Posts
      </Link>
      <PageHeader
        title={id ? values.title || 'Untitled post' : 'New post'}
        actions={
          <>
            <StatusBadge status={status} />
            {meta?.publishedAt && status !== 'draft' && (
              <span className="text-xs text-muted-foreground">
                {status === 'scheduled' ? 'Goes live' : 'Published'} {formatDate(meta.publishedAt)}
              </span>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-4">
          <div className="space-y-1">
            <label htmlFor="post-title" className="sr-only">
              Title
            </label>
            <input
              id="post-title"
              value={values.title}
              onChange={(e) => {
                const title = e.target.value;
                setValues((s) => ({ ...s, title, slug: slugTouched ? s.slug : slugify(title) }));
              }}
              placeholder="Post title"
              aria-invalid={errors.title ? true : undefined}
              className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60"
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <RichTextEditor value={values.content} onChange={(content) => set('content', content)} />
        </div>

        <aside className="space-y-4">
          <FormSection title="Publish">
            <div className="grid gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => save(status === 'draft' ? 'draft' : undefined)}>
                {pending && <Spinner />}
                {status === 'draft' ? 'Save draft' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" disabled={pending} onClick={preview}>
                <Eye data-icon="inline-start" /> Preview
              </Button>
              {status !== 'published' && (
                <Button type="button" disabled={pending} onClick={() => save('published', null)}>
                  <Send data-icon="inline-start" /> Publish now
                </Button>
              )}
              {status !== 'draft' && (
                <Button type="button" variant="ghost" disabled={pending} onClick={() => save('draft')}>
                  <EyeOff data-icon="inline-start" /> Unpublish
                </Button>
              )}
              {publicUrl && (
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'ghost' }))}>
                  View live post
                </a>
              )}
            </div>
            <div className="space-y-2 border-t pt-4">
              <TextField label="Schedule for" type="datetime-local" value={scheduleAt} onChange={setScheduleAt} hint="Published automatically at this time." />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={pending || !scheduleAt}
                onClick={() => {
                  const when = new Date(scheduleAt);
                  if (when <= new Date()) {
                    toast.error('Choose a time in the future');
                    return;
                  }
                  void save('scheduled', when.toISOString());
                }}
              >
                <CalendarClock data-icon="inline-start" /> {status === 'scheduled' ? 'Reschedule' : 'Schedule'}
              </Button>
            </div>
            <SwitchField label="Featured" checked={values.featured} onChange={(v) => set('featured', v)} />
          </FormSection>

          <FormSection title="Post details">
            <TextField
              label="Slug"
              value={values.slug}
              error={errors.slug}
              hint={`/blog/${values.slug || 'generated-from-title'}`}
              onChange={(slug) => {
                setSlugTouched(true);
                set('slug', slug.toLowerCase());
              }}
            />
            <TextAreaField label="Excerpt" rows={3} maxLength={400} value={values.excerpt} onChange={(v) => set('excerpt', v)} hint="Generated from the content if left empty." />
            <ImageField label="Cover image" folder="blog" value={values.coverImage} onChange={(v) => set('coverImage', v)} />
            <SelectField
              label="Category"
              value={values.category}
              placeholder="No category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(v) => set('category', v)}
              hint={categories.length === 0 ? 'Create categories under Categories & tags.' : undefined}
            />
            <div className="space-y-1.5">
              <p className="text-[0.8rem] font-medium">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => {
                  const on = values.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('tags', on ? values.tags.filter((x) => x !== t.id) : [...values.tags, t.id])}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-xs transition-colors',
                        on ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void createTag();
                    }
                  }}
                  placeholder="New tag"
                  aria-label="New tag name"
                  className="h-8"
                />
                <Button type="button" size="sm" variant="outline" onClick={createTag} disabled={!newTag.trim()}>
                  <Plus />
                </Button>
              </div>
            </div>
            <TextField label="Author name" value={values.authorName} onChange={(v) => set('authorName', v)} hint="Defaults to your profile name." />
          </FormSection>

          <FormSection title="SEO">
            <TextField label="SEO title" value={values.seoTitle} onChange={(v) => set('seoTitle', v)} maxLength={70} error={errors.seoTitle} hint={`${values.seoTitle.length}/70 · defaults to the post title`} />
            <TextAreaField label="SEO description" rows={3} maxLength={170} value={values.seoDescription} onChange={(v) => set('seoDescription', v)} error={errors.seoDescription} />
            <TextField label="Canonical URL" value={values.canonicalUrl} onChange={(v) => set('canonicalUrl', v)} error={errors.canonicalUrl} hint="Only if this post was first published elsewhere." />
          </FormSection>
        </aside>
      </div>
      {dirty && (
        <p className="sticky bottom-4 mx-auto mt-6 w-fit rounded-full border bg-background px-4 py-1.5 text-xs text-muted-foreground shadow" role="status">
          Unsaved changes
        </p>
      )}
    </div>
  );
}
