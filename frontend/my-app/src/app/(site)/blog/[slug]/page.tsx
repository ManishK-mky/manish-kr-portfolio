import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JsonLd } from "@/components/site/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { Article } from "@/features/blog/article";
import { PostCard } from "@/features/blog/post-card";
import { ShareLinks } from "@/features/blog/share-links";
import { SITE_URL } from "@/lib/api/config";
import { getPost, getPostSlugs, getSettings } from "@/lib/api/public";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const posts = await getPostSlugs();
  return posts.length ? posts.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER }];
}

async function load(slug: string) {
  return slug === PLACEHOLDER ? null : getPost(slug);
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  if (!post) return { title: "Article not found", robots: { index: false } };
  const title = post.seo.title || post.title;
  const description = post.seo.description || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: post.seo.canonicalUrl || `/blog/${post.slug}` },
    authors: [{ name: post.author.name }],
    keywords: post.tags.map((t) => t.name),
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags.map((t) => t.name),
      images: post.coverImage ? [{ url: post.coverImage.url, alt: post.coverImage.alt || post.title }] : undefined,
    },
    twitter: { card: post.coverImage ? "summary_large_image" : "summary", title, description },
  };
}

export default function PostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([load(slug), getSettings()]);
  if (!post) notFound();
  const url = `${settings.siteUrl || SITE_URL}/blog/${post.slug}`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          image: post.coverImage?.url,
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: { "@type": "Person", name: post.author.name },
          wordCount: post.wordCount,
          keywords: post.tags.map((t) => t.name).join(", "),
          mainEntityOfPage: url,
        }}
      />
      <Article
        post={post}
        aside={<ShareLinks url={url} title={post.title} />}
        footer={
          <div className="mt-10 border-t pt-8 lg:hidden">
            <ShareLinks url={url} title={post.title} />
          </div>
        }
      />
      {post.related.length > 0 && (
        <section aria-labelledby="related-title" className="container-page mt-28">
          <h2 id="related-title" className="mb-10 text-2xl font-semibold tracking-tight">
            Keep reading
          </h2>
          <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {post.related.map((r) => (
              <li key={r.id}>
                <PostCard post={r} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function PostSkeleton() {
  return (
    <div className="container-page max-w-3xl space-y-6 pt-20 text-center" aria-hidden="true">
      <Skeleton className="mx-auto h-3 w-24" />
      <Skeleton className="mx-auto h-12 w-4/5" />
      <Skeleton className="mx-auto h-5 w-3/5" />
      <div className="space-y-3 pt-12 text-left">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
