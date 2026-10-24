'use client';

import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Article } from '@/features/blog/article';
import { api, errorMessage } from '@/lib/api/client';
import type { Post, TiptapDoc } from '@/types/api';
import { ErrorState, LoadingRows } from '../components/page-header';
import { PREVIEW_STORAGE_KEY } from './blog-editor';

/**
 * Renders a post exactly as the public page would, from the API's sanitized
 * HTML. Unsaved editor content (handed over once via localStorage) is rendered by the
 * admin-only preview endpoint; nothing here is publicly reachable.
 */
export function BlogPreviewPage({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Read once at mount (state initializers survive Strict Mode's double effects).
  const [content] = useState<TiptapDoc | undefined>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(PREVIEW_STORAGE_KEY(id)) : null;
      return raw ? (JSON.parse(raw) as TiptapDoc) : undefined;
    } catch {
      return undefined;
    }
  });

  useEffect(() => {
    try {
      localStorage.removeItem(PREVIEW_STORAGE_KEY(id));
    } catch {
      /* ignore */
    }
    api<Post>(`/blog/${id}/preview`, { method: 'POST', body: content ? { content } : {} })
      .then(setPost)
      .catch((err) => setError(errorMessage(err)));
  }, [id, content]);

  return (
    <div className="-mx-4 -my-8 bg-background pb-24 md:-mx-8">
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 border-b bg-warning/15 px-4 py-2 text-sm backdrop-blur md:px-8">
        <span className="flex items-center gap-2">
          <Eye className="size-4" /> Preview — {post?.status === 'published' ? 'published post' : 'not visible to the public'}
        </span>
        <Link href={`/admin/blog/${id}`} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
          <ArrowLeft className="size-3.5" /> Back to editor
        </Link>
      </div>
      {error ? (
        <div className="p-8">
          <ErrorState message={error} />
        </div>
      ) : !post ? (
        <div className="p-8">
          <LoadingRows rows={6} />
        </div>
      ) : (
        <Article post={post} />
      )}
    </div>
  );
}
