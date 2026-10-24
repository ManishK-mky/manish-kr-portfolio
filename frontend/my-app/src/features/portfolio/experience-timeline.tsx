import { ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { CloudImage } from '@/components/site/cloud-image';
import { formatRange } from '@/lib/format';
import type { Experience } from '@/types/api';
import { TechList } from './project-card';
import { SectionHeader } from './section-header';

/** Consecutive positions at the same company are grouped under one heading. */
function groupByCompany(items: Experience[]) {
  const groups: { company: Experience['company']; positions: Experience[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.company?.id === item.company?.id) last.positions.push(item);
    else groups.push({ company: item.company, positions: [item] });
  }
  return groups;
}

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

export function ExperienceTimeline({ items }: { items: Experience[] }) {
  if (items.length === 0) return null;
  const groups = groupByCompany(items);
  return (
    <section id="experience" aria-labelledby="experience-title" className="container-page py-24">
      <SectionHeader
        id="experience-title"
        index="02"
        eyebrow="Experience"
        title="Where I’ve worked"
        description="A record of teams I’ve been part of, what I owned and what changed because of it."
      />
      <ol className="divide-y border-y">
        {groups.map((group) => (
          <Reveal as="li" key={`${group.company?.id}-${group.positions[0].id}`} className="grid gap-6 py-10 md:grid-cols-[14rem_1fr] md:gap-12">
            <div className="flex items-start gap-3 md:flex-col">
              <div className="size-11 shrink-0 overflow-hidden rounded-lg border bg-card">
                <CloudImage image={group.company?.logo} label={group.company?.name ?? 'Company'} sizes="44px" />
              </div>
              <div>
                <h3 className="font-semibold tracking-tight">
                  {group.company?.website ? (
                    <a
                      href={group.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1 hover:text-brand"
                    >
                      {group.company.name}
                      <ArrowUpRight className="size-3.5 opacity-50 group-hover:opacity-100" aria-hidden="true" />
                    </a>
                  ) : (
                    group.company?.name
                  )}
                </h3>
                {group.company?.industry && (
                  <p className="text-sm text-muted-foreground">{group.company.industry}</p>
                )}
              </div>
            </div>

            <ol className="relative space-y-10 border-l pl-6 md:pl-8">
              {group.positions.map((p) => (
                <li key={p.id} className="relative">
                  <span
                    className={`absolute top-2 -left-[calc(1.5rem+4.5px)] size-2 rounded-full ring-4 ring-background md:-left-[calc(2rem+4.5px)] ${p.current ? 'bg-brand' : 'bg-border'}`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <h4 className="text-lg font-medium">{p.title}</h4>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatRange(p.startDate, p.endDate, p.current)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[label(p.employmentType), p.location, label(p.workMode)].filter(Boolean).join(' · ')}
                  </p>
                  {p.summary && <p className="mt-4 text-pretty">{p.summary}</p>}
                  {p.responsibilities.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {p.responsibilities.map((r) => (
                        <li key={r} className="flex gap-3">
                          <span className="mt-2 h-px w-3 shrink-0 bg-muted-foreground/50" aria-hidden="true" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.achievements.length > 0 && (
                    <ul className="mt-4 space-y-2 text-sm">
                      {p.achievements.map((a) => (
                        <li key={a} className="border-l-2 border-brand/60 pl-3">
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                  <TechList items={p.technologies} max={8} className="mt-5" />
                </li>
              ))}
            </ol>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
