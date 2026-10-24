import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { CloudImage } from '@/components/site/cloud-image';
import { formatRange } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/api';

export function TechList({ items, max = 5, className }: { items: string[]; max?: number; className?: string }) {
  if (!items.length) return null;
  const shown = items.slice(0, max);
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Technologies">
      {shown.map((t) => (
        <li key={t} className="rounded-full border px-2.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
          {t}
        </li>
      ))}
      {items.length > max && (
        <li className="px-1 py-0.5 font-mono text-[0.7rem] text-muted-foreground">+{items.length - max}</li>
      )}
    </ul>
  );
}

/** Large, image-led card for the lead featured project. */
export function ProjectFeature({ project, priority }: { project: Project; priority?: boolean }) {
  return (
    <article className="group relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl border bg-subtle">
        <CloudImage
          image={project.cover}
          label={project.title}
          sizes="(min-width: 1024px) 42rem, 100vw"
          priority={priority}
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.025]"
        />
      </div>
      <div className="space-y-5">
        <p className="eyebrow">
          {[project.category, formatRange(project.startDate, project.endDate)].filter(Boolean).join(' · ')}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className="text-pretty text-muted-foreground">{project.summary}</p>
        {project.achievements?.[0] && (
          <p className="border-l-2 border-brand pl-4 text-sm">{project.achievements[0]}</p>
        )}
        <TechList items={project.technologies} />
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          Read case study
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </article>
  );
}

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-subtle">
        <CloudImage
          image={project.cover}
          label={project.title}
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 pt-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight">
            <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0">
              {project.title}
            </Link>
          </h3>
          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden="true"
          />
        </div>
        <p className="line-clamp-2 text-sm text-pretty text-muted-foreground">{project.summary}</p>
        <TechList items={project.technologies} max={4} className="mt-auto pt-1" />
      </div>
    </article>
  );
}
