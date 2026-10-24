import Link from 'next/link';
import { CloudImage } from '@/components/site/cloud-image';
import type { Post } from '@/types/api';
import { PostMeta } from './post-card';
import { TableOfContents } from './table-of-contents';

/**
 * Article layout shared by the public post page and the admin preview.
 * `post.html` is rendered and sanitized by the API from the stored Tiptap JSON.
 */
export function Article({
  post,
  aside,
  footer,
}: {
  post: Post;
  aside?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <article>
      <header className="container-page max-w-4xl pt-12 text-center md:pt-20">
        {post.category && (
          <Link href={`/blog?category=${post.category.slug}`} className="eyebrow hover:text-foreground">
            {post.category.name}
          </Link>
        )}
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-balance md:text-[3.25rem] md:leading-[1.1]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground">{post.excerpt}</p>
        )}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm font-medium">{post.author.name}</p>
          <PostMeta post={{ ...post, category: null }} />
        </div>
      </header>

      {post.coverImage && (
        <div className="container-page mt-14">
          <div className="aspect-[2/1] overflow-hidden rounded-3xl border bg-subtle">
            <CloudImage image={post.coverImage} label={post.title} sizes="(min-width: 1152px) 72rem, 100vw" priority />
          </div>
        </div>
      )}

      <div className="container-page mt-16 grid gap-12 lg:grid-cols-[1fr_15rem] lg:gap-16">
        <div className="min-w-0 lg:pl-[calc((100%-42rem)/2)]">
          <div className="prose-article" dangerouslySetInnerHTML={{ __html: post.html }} />
          {post.tags.length > 0 && (
            <ul className="mt-14 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/blog?tag=${t.slug}`}
                    className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {footer}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-10">
            <TableOfContents entries={post.toc} />
            {aside}
          </div>
        </aside>
      </div>
    </article>
  );
}
