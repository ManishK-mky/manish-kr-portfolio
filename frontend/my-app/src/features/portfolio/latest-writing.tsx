import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { PostRow } from '@/features/blog/post-card';
import type { PostSummary } from '@/types/api';
import { SectionHeader } from './section-header';

export function LatestWriting({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) return null;
  return (
    <section id="writing" aria-labelledby="writing-title" className="container-page py-24">
      <SectionHeader
        id="writing-title"
        index="05"
        eyebrow="Writing"
        title="Notes on building software"
        action={
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            All articles
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <ul className="divide-y border-y">
        {posts.map((post, i) => (
          <Reveal as="li" key={post.id} delay={i * 0.05}>
            <PostRow post={post} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
