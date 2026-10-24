import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import type { Project } from '@/types/api';
import { ProjectCard, ProjectFeature } from './project-card';
import { SectionHeader } from './section-header';

export function FeaturedWork({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;
  const [lead, ...rest] = projects;
  return (
    <section id="work" aria-labelledby="work-title" className="container-page py-24">
      <SectionHeader
        id="work-title"
        index="01"
        eyebrow="Selected work"
        title="Products and systems I’ve helped bring to life"
        action={
          <Link
            href="/projects"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            All projects
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />
      <Reveal>
        <ProjectFeature project={lead} />
      </Reveal>
      {rest.length > 0 && (
        <ul className="mt-20 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((project, i) => (
            <Reveal as="li" key={project.id} delay={i * 0.06}>
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
