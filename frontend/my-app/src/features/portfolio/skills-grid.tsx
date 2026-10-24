import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';
import type { SkillGroup } from '@/types/api';
import { SectionHeader } from './section-header';

export function SkillsGrid({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;
  return (
    <section id="skills" aria-labelledby="skills-title" className="container-page py-24">
      <SectionHeader
        id="skills-title"
        index="04"
        eyebrow="Skills"
        title="Tools I reach for"
        description="Highlighted items are what I use most day to day."
      />
      <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group, i) => (
          <Reveal key={group.id} delay={(i % 4) * 0.05} className="bg-background p-6">
            <h3 className="eyebrow mb-5">{group.name}</h3>
            <ul className="space-y-2.5">
              {group.skills.map((skill) => (
                <li key={skill.id} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className={cn('flex items-center gap-2', skill.featured && 'font-medium')}>
                    <span
                      className={cn('size-1.5 rounded-full', skill.featured ? 'bg-brand' : 'bg-border')}
                      aria-hidden="true"
                    />
                    {skill.name}
                    {skill.featured && <span className="sr-only">(core skill)</span>}
                  </span>
                  {skill.proficiency && (
                    <span className="font-mono text-[0.7rem] text-muted-foreground">{skill.proficiency}</span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
