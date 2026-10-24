import { Reveal } from '@/components/motion/reveal';
import { CloudImage } from '@/components/site/cloud-image';
import { formatRange } from '@/lib/format';
import type { Education } from '@/types/api';
import { SectionHeader } from './section-header';

export function EducationList({ items }: { items: Education[] }) {
  if (items.length === 0) return null;
  return (
    <section id="education" aria-labelledby="education-title" className="container-page py-24">
      <SectionHeader id="education-title" index="03" eyebrow="Education" title="Foundations" />
      <ul className="grid gap-6 md:grid-cols-2">
        {items.map((e, i) => (
          <Reveal as="li" key={e.id} delay={i * 0.05} className="flex flex-col rounded-2xl border bg-card p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="size-12 shrink-0 overflow-hidden rounded-lg border bg-background">
                <CloudImage image={e.logo} label={e.institution} sizes="48px" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-xs text-muted-foreground">{formatRange(e.startDate, e.endDate)}</p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  {e.degree}
                  {e.fieldOfStudy && <span className="font-normal text-muted-foreground">, {e.fieldOfStudy}</span>}
                </h3>
                <p className="text-sm">
                  {e.website ? (
                    <a href={e.website} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                      {e.institution}
                    </a>
                  ) : (
                    e.institution
                  )}
                  {e.grade && <span className="text-muted-foreground"> · Grade {e.grade}</span>}
                </p>
              </div>
            </div>
            {e.description && <p className="mt-5 text-sm text-pretty text-muted-foreground">{e.description}</p>}
            {e.coursework.length > 0 && (
              <div className="mt-5">
                <p className="eyebrow mb-2">Coursework</p>
                <p className="text-sm">{e.coursework.join(' · ')}</p>
              </div>
            )}
            {(e.achievements.length > 0 || e.activities.length > 0) && (
              <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
                {[...e.achievements, ...e.activities].map((a) => (
                  <li key={a} className="flex gap-3">
                    <span className="mt-2 h-px w-3 shrink-0 bg-muted-foreground/50" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
