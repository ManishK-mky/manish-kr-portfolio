import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { CloudImage } from '@/components/site/cloud-image';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PostSummary } from '@/types/api';

type CardPost = Pick<PostSummary, 'id' | 'title' | 'slug' | 'excerpt' | 'coverImage' | 'publishedAt' | 'readingTime'> &
  Partial<Pick<PostSummary, 'category' | 'tags'>>;

export function PostMeta({ post, className }: { post: CardPost; className?: string }) {
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 font-mono text-xs text-muted-foreground', className)}>
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
      <span aria-hidden="true">·</span>
      <span>{post.readingTime} min read</span>
      {post.category && (
        <>
          <span aria-hidden="true">·</span>
          <span>{post.category.name}</span>
        </>
      )}
    </p>
  );
}

/** Editorial list row: text-led, with an optional thumbnail. */
export function PostRow({ post }: { post: CardPost }) {
  return (
    <article className="group relative grid gap-5 py-8 sm:grid-cols-[1fr_11rem] sm:items-center sm:gap-10">
      <div className="space-y-3">
        <PostMeta post={post} />
        <h3 className="text-xl font-semibold tracking-tight text-balance">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="line-clamp-2 text-pretty text-muted-foreground">{post.excerpt}</p>}
      </div>
      <div className="relative hidden aspect-[4/3] overflow-hidden rounded-lg border bg-subtle sm:block">
        <CloudImage
          image={post.coverImage}
          label={post.title}
          sizes="176px"
          imgClassName="transition-transform duration-700 group-hover:scale-105"
        />
        <ArrowUpRight
          className="absolute top-2 right-2 size-4 rounded-full bg-background/90 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: CardPost }) {
  return (
    <article className="group relative flex flex-col">
      <div className="aspect-[16/10] overflow-hidden rounded-xl border bg-subtle">
        <CloudImage
          image={post.coverImage}
          label={post.title}
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 50vw, 100vw"
          imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="space-y-2 pt-4">
        <PostMeta post={post} />
        <h3 className="font-semibold tracking-tight text-balance">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
      </div>
    </article>
  );
}
