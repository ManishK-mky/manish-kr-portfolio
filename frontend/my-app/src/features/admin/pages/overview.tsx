'use client';

import { ArrowRight, BookOpen, Briefcase, FolderKanban, GraduationCap, Images, Mail, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/types/api';
import { useAuth } from '../auth/auth-provider';
import { ErrorState, LoadingRows, PageHeader, StatusBadge } from '../components/page-header';
import { useApiQuery } from '../hooks/use-api';

export function OverviewPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApiQuery<DashboardStats>('/dashboard/stats');

  const cards = data
    ? [
        { label: 'Projects', value: data.projects.total, sub: `${data.projects.published} published · ${data.projects.drafts} drafts`, href: '/admin/projects', icon: FolderKanban },
        {
          label: 'Blog posts',
          value: data.posts.total,
          sub: `${data.posts.published} published · ${data.posts.drafts} drafts · ${data.posts.scheduled} scheduled`,
          href: '/admin/blog',
          icon: BookOpen,
        },
        { label: 'Positions', value: data.experience, sub: 'Experience records', href: '/admin/experience', icon: Briefcase },
        { label: 'Education', value: data.education, sub: 'Records', href: '/admin/education', icon: GraduationCap },
        { label: 'Skills', value: data.skills, sub: 'Across all categories', href: '/admin/skills', icon: Sparkles },
        { label: 'Media', value: data.media, sub: 'Files in Cloudinary', href: '/admin/media', icon: Images },
      ]
    : [];

  return (
    <>
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        description="Everything you publish here appears on the public site within seconds."
        actions={
          <>
            <Link href="/admin/projects/new" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Plus data-icon="inline-start" /> Project
            </Link>
            <Link href="/admin/blog/new" className={buttonVariants({ size: 'sm' })}>
              <Plus data-icon="inline-start" /> Blog post
            </Link>
          </>
        }
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingRows rows={4} />
      ) : (
        <div className="space-y-8">
          {data.unreadMessages > 0 && (
            <Link
              href="/admin/messages"
              className="flex items-center justify-between rounded-xl border border-brand/30 bg-brand-soft px-5 py-4 text-sm"
            >
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-brand" /> You have {data.unreadMessages} unread message
                {data.unreadMessages > 1 ? 's' : ''}.
              </span>
              <ArrowRight className="size-4" />
            </Link>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ label, value, sub, href, icon: Icon }) => (
              <li key={label}>
                <Link href={href} className="group block rounded-xl border bg-card p-5 transition-colors hover:border-foreground/20">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {label}
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                </Link>
              </li>
            ))}
          </ul>
          <section className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="font-semibold tracking-tight">Recently edited posts</h2>
              <Link href="/admin/blog" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                All posts
              </Link>
            </div>
            {data.recentPosts.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <ul className="divide-y">
                {data.recentPosts.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/blog/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-accent/50">
                      <span className="truncate text-sm font-medium">{p.title}</span>
                      <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                        {formatDate(p.updatedAt)}
                        <StatusBadge status={p.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
