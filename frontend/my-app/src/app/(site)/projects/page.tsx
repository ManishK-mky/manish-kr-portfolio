import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/site/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/features/portfolio/project-card";
import { SectionHeader } from "@/features/portfolio/section-header";
import { getProjectFacets, getProjects } from "@/lib/api/public";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Projects",
  description: "Case studies of products, systems and open-source work.",
  alternates: { canonical: "/projects" },
};

type SearchParams = PageProps<"/projects">["searchParams"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  return (
    <div className="container-page pt-16 pb-8 md:pt-24">
      <SectionHeader
        as="h1"
        eyebrow="Projects"
        title="Selected work and case studies"
        description="Products, platforms and open-source tools — with the problems behind them and what changed after launch."
      />
      <Suspense fallback={<ProjectGridSkeleton />}>
        <ProjectResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProjectResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = first(params.category);
  const page = Math.max(1, Number(first(params.page)) || 1);
  const [{ items, meta }, facets] = await Promise.all([getProjects(page, category), getProjectFacets()]);

  const href = (p: number, c = category) => {
    const qs = new URLSearchParams();
    if (c) qs.set("category", c);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/projects?${s}` : "/projects";
  };

  return (
    <>
      {facets.categories.length > 1 && (
        <nav aria-label="Filter by category" className="mb-12 flex flex-wrap gap-2">
          {[undefined, ...facets.categories].map((c) => {
            const active = c === category;
            return (
              <Link
                key={c ?? "all"}
                href={href(1, c)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  active ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {c ?? "All"}
              </Link>
            );
          })}
        </nav>
      )}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed py-20 text-center text-muted-foreground">
          No projects published yet.
        </p>
      ) : (
        <ul className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} href={href} />
    </>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
