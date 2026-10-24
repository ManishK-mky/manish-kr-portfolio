import { ArrowRight, Download, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { AvailabilityBadge } from "@/components/site/availability";
import { CloudImage } from "@/components/site/cloud-image";
import { buttonVariants } from "@/components/ui/button";
import { EducationList } from "@/features/portfolio/education-list";
import { ExperienceTimeline } from "@/features/portfolio/experience-timeline";
import { getEducation, getExperience, getProfile } from "@/lib/api/public";
import { paragraphs } from "@/lib/format";
import { FALLBACK_HEADSHOT } from "@/lib/site-assets";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    title: "About",
    description: profile.intro || `About ${profile.name}`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const [profile, experience, education] = await Promise.all([getProfile(), getExperience(), getEducation()]);
  const bio = paragraphs(profile.bio);

  return (
    <>
      <section className="container-page pt-16 pb-16 md:pt-24">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-[4/5] overflow-hidden rounded-[1.75rem] border bg-subtle">
              <CloudImage
                image={profile.aboutImage ?? profile.avatar ?? FALLBACK_HEADSHOT}
                label={profile.name}
                sizes="(min-width: 1024px) 26rem, 90vw"
                priority
              />
            </div>
            {profile.location && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" /> {profile.location}
              </p>
            )}
          </Reveal>

          <div className="space-y-10">
            <div className="space-y-6">
              <AvailabilityBadge availability={profile.availability} />
              <p className="eyebrow">About</p>
              <h1 className="text-4xl font-semibold tracking-[-0.03em] text-balance md:text-5xl">
                {profile.name}
                {profile.role && <span className="block text-muted-foreground">{profile.role}</span>}
              </h1>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-pretty">
              {(bio.length ? bio : [profile.intro]).filter(Boolean).map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>

            {profile.stats.length > 0 && (
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
                {profile.stats.map((s) => (
                  <div key={s.label} className="bg-background p-5">
                    <dt className="text-sm text-muted-foreground">{s.label}</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-wrap gap-3">
              <Link href="/#contact" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-5")}>
                Work with me <ArrowRight data-icon="inline-end" />
              </Link>
              {profile.cv && (
                <a
                  href={profile.cv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-5")}
                >
                  <Download data-icon="inline-start" /> Download CV
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
      <ExperienceTimeline items={experience} />
      <EducationList items={education} />
    </>
  );
}
