import { ArrowLeft, ArrowUpRight, Calendar, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/motion/reveal";
import { CloudImage } from "@/components/site/cloud-image";
import { JsonLd } from "@/components/site/json-ld";
import { SocialIcon } from "@/components/site/social-icon";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TechList } from "@/features/portfolio/project-card";
import { getProject, getProjectSlugs } from "@/lib/api/public";
import { formatRange, paragraphs } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "__placeholder__";

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  // Cache Components needs at least one param; the placeholder renders a 404.
  return slugs.length ? slugs.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = slug === PLACEHOLDER ? null : await getProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      url: `/projects/${project.slug}`,
      images: project.cover ? [{ url: project.cover.url, alt: project.cover.alt || project.title }] : undefined,
    },
  };
}

export default function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectContent params={params} />
    </Suspense>
  );
}

async function ProjectContent({ params }: { params: PageProps<"/projects/[slug]">["params"] }) {
  const { slug } = await params;
  const project = slug === PLACEHOLDER ? null : await getProject(slug);
  if (!project) notFound();

  const meta = [
    project.role && { icon: User, label: "Role", value: project.role },
    formatRange(project.startDate, project.endDate) && {
      icon: Calendar,
      label: "Timeline",
      value: formatRange(project.startDate, project.endDate),
    },
  ].filter(Boolean) as { icon: typeof User; label: string; value: string }[];

  return (
    <article className="pb-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.summary,
          image: project.cover?.url,
          dateCreated: project.startDate ?? undefined,
          keywords: project.technologies.join(", "),
        }}
      />
      <header className="container-page pt-12 md:pt-20">
        <Link
          href="/projects"
          className="group mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          All projects
        </Link>
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-end">
          <div className="space-y-6">
            {project.category && <p className="eyebrow">{project.category}</p>}
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-6xl">{project.title}</h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{project.summary}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-5")}
              >
                Visit live site <ArrowUpRight data-icon="inline-end" />
              </a>
            )}
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-5")}
              >
                <SocialIcon platform="github" className="size-4" data-icon="inline-start" />
                Source code
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="container-page mt-14">
        <div className="aspect-[16/9] overflow-hidden rounded-3xl border bg-subtle">
          <CloudImage image={project.cover} label={project.title} sizes="(min-width: 1152px) 72rem, 100vw" priority />
        </div>
      </div>

      <div className="container-page mt-16 grid gap-14 lg:grid-cols-[16rem_1fr] lg:gap-20">
        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {meta.map(({ icon: Icon, label, value }) => (
            <div key={label}>
              <p className="eyebrow mb-1.5 flex items-center gap-2">
                <Icon className="size-3.5" aria-hidden="true" />
                {label}
              </p>
              <p className="text-sm">{value}</p>
            </div>
          ))}
          {project.technologies.length > 0 && (
            <div>
              <p className="eyebrow mb-3">Stack</p>
              <TechList items={project.technologies} max={20} />
            </div>
          )}
          {(project.responsibilities?.length ?? 0) > 0 && (
            <div>
              <p className="eyebrow mb-3">Responsibilities</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {project.responsibilities!.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className="max-w-2xl space-y-16">
          {project.description && (
            <section aria-labelledby="overview" className="space-y-5 text-[1.0625rem] leading-relaxed">
              <h2 id="overview" className="text-2xl font-semibold tracking-tight">
                Overview
              </h2>
              {paragraphs(project.description).map((p) => (
                <p key={p.slice(0, 40)} className="text-pretty">
                  {p}
                </p>
              ))}
            </section>
          )}

          {project.achievements.length > 0 && (
            <section aria-labelledby="impact">
              <h2 id="impact" className="mb-6 text-2xl font-semibold tracking-tight">
                Impact
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {project.achievements.map((a) => (
                  <li key={a} className="rounded-xl border bg-card p-5 text-sm">
                    <span className="mb-3 block h-0.5 w-6 bg-brand" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(project.features?.length ?? 0) > 0 && (
            <section aria-labelledby="features">
              <h2 id="features" className="mb-6 text-2xl font-semibold tracking-tight">
                Key features
              </h2>
              <ul className="divide-y border-y">
                {project.features!.map((f, i) => (
                  <li key={f} className="flex gap-6 py-4">
                    <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    {f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(project.challenges?.length ?? 0) > 0 && (
            <section aria-labelledby="challenges" className="space-y-8">
              <h2 id="challenges" className="text-2xl font-semibold tracking-tight">
                Challenges &amp; solutions
              </h2>
              {project.challenges!.map((c) => (
                <div key={c.challenge} className="grid gap-4 border-l-2 pl-6">
                  <div>
                    <p className="eyebrow mb-1">Challenge</p>
                    <p className="text-pretty">{c.challenge}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1 text-brand">Solution</p>
                    <p className="text-pretty text-muted-foreground">{c.solution}</p>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {(project.gallery?.length ?? 0) > 0 && (
        <section aria-label="Gallery" className="container-page mt-24 grid gap-6 md:grid-cols-2">
          {project.gallery!.map((img, i) => (
            <Reveal key={img.mediaId + i} className={cn(i % 3 === 0 && "md:col-span-2")}>
              <figure>
                <div className="overflow-hidden rounded-2xl border bg-subtle">
                  <CloudImage
                    image={img}
                    label={`${project.title} screenshot ${i + 1}`}
                    sizes={i % 3 === 0 ? "(min-width: 1152px) 72rem, 100vw" : "(min-width: 768px) 36rem, 100vw"}
                    fill={false}
                  />
                </div>
                {img.caption && (
                  <figcaption className="mt-3 text-sm text-muted-foreground">{img.caption}</figcaption>
                )}
              </figure>
            </Reveal>
          ))}
        </section>
      )}

      {project.next && (
        <nav aria-label="Next project" className="container-page mt-28">
          <Link
            href={`/projects/${project.next.slug}`}
            className="group grid items-center gap-8 rounded-3xl border bg-card p-6 transition-colors hover:bg-accent/40 md:grid-cols-[1fr_18rem] md:p-10"
          >
            <div className="space-y-3">
              <p className="eyebrow">Next project</p>
              <p className="text-2xl font-semibold tracking-tight md:text-3xl">{project.next.title}</p>
              <p className="text-muted-foreground">{project.next.summary}</p>
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-subtle">
              <CloudImage image={project.next.cover} label={project.next.title} sizes="288px" />
            </div>
          </Link>
        </nav>
      )}
    </article>
  );
}

function ProjectSkeleton() {
  return (
    <div className="container-page space-y-8 pt-20" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-14 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="aspect-[16/9] w-full rounded-3xl" />
    </div>
  );
}
