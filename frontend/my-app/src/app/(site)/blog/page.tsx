import { Search } from "lucide-react";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/site/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard, PostRow } from "@/features/blog/post-card";
import { SectionHeader } from "@/features/portfolio/section-header";
import { getBlogTaxonomy, getPosts } from "@/lib/api/public";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description: "Articles on frontend architecture, backend systems and product design.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
};

type SearchParams = PageProps<"/blog">["searchParams"];
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function BlogPage({ searchParams }: PageProps<"/blog">) {
  return (
    <div className="container-page pt-16 pb-8 md:pt-24">
      <SectionHeader
        as="h1"
        eyebrow="Blog"
        title="Writing on building software"
        description="Long-form notes on frontend architecture, backend systems and the craft of product engineering."
      />
      <Suspense fallback={<ResultsSkeleton />}>
        <BlogResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function BlogResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = first(params.q)?.slice(0, 100) ?? "";
  const category = first(params.category);
  const tag = first(params.tag);
  const page = Math.max(1, Number(first(params.page)) || 1);

  const [{ items, meta }, taxonomy] = await Promise.all([
    getPosts({ page, search: search || undefined, category, tag }),
    getBlogTaxonomy(),
  ]);

  const href = (overrides: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    const merged = { q: search || undefined, category, tag, page: undefined as number | undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "" && !(k === "page" && v === 1)) qs.set(k, String(v));
    }
    const s = qs.toString();
    return s ? `/blog?${s}` : "/blog";
  };

  const filtered = Boolean(search || category || tag);
  const [lead, ...rest] = items;
  const showLead = !filtered && page === 1 && lead;

  return (
    <>
      <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Categories" className="flex flex-wrap gap-2">
          {[{ slug: undefined, name: "All" }, ...taxonomy.categories].map((c) => {
            const active = c.slug === category;
            return (
              <Link
                key={c.slug ?? "all"}
                href={href({ category: c.slug, page: undefined })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </Link>
            );
          })}
        </nav>
        <Form action="/blog" role="search" className="relative w-full lg:w-72">
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="blog-search" className="sr-only">
            Search articles
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="blog-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search articles…"
            className="h-10 w-full rounded-full border bg-card pr-4 pl-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Form>
      </div>

      {tag && (
        <p className="mb-8 text-sm text-muted-foreground">
          Tagged <span className="font-medium text-foreground">#{taxonomy.tags.find((t) => t.slug === tag)?.name ?? tag}</span>{" "}
          · <Link href={href({ tag: undefined })} className="underline underline-offset-4">clear</Link>
        </p>
      )}
      {search && (
        <p className="mb-8 text-sm text-muted-foreground" role="status">
          {meta.total} result{meta.total === 1 ? "" : "s"} for “{search}” ·{" "}
          <Link href={href({ q: undefined })} className="underline underline-offset-4">clear</Link>
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
          {filtered ? "No articles match your filters." : "No articles published yet."}
        </p>
      ) : (
        <>
          {showLead && (
            <div className="mb-14">
              <PostCardLarge post={lead} />
            </div>
          )}
          <ul className="divide-y border-y">
            {(showLead ? rest : items).map((post) => (
              <li key={post.id}>
                <PostRow post={post} />
              </li>
            ))}
          </ul>
        </>
      )}
      <Pagination meta={meta} href={(p) => href({ page: p })} />

      {taxonomy.tags.length > 0 && (
        <nav aria-label="Tags" className="mt-20 border-t pt-10">
          <p className="eyebrow mb-4">Browse by tag</p>
          <ul className="flex flex-wrap gap-2">
            {taxonomy.tags.map((t) => (
              <li key={t.id}>
                <Link
                  href={href({ tag: t.slug, page: undefined })}
                  className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                >
                  #{t.name} <span className="opacity-60">{t.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}

function PostCardLarge({ post }: { post: Parameters<typeof PostCard>[0]["post"] }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 md:items-center">
      <PostCard post={post} />
      <p className="hidden text-lg text-pretty text-muted-foreground md:block">{post.excerpt}</p>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-3 border-t py-8">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
