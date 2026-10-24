import { ArrowDownRight, ArrowRight, Download, MapPin } from 'lucide-react';
import Link from 'next/link';
import { AvailabilityBadge } from '@/components/site/availability';
import { CloudImage } from '@/components/site/cloud-image';
import { SocialIcon } from '@/components/site/social-icon';
import { buttonVariants } from '@/components/ui/button';
import { FALLBACK_HEADSHOT } from '@/lib/site-assets';
import { cn } from '@/lib/utils';
import type { Profile, SocialLink } from '@/types/api';
import { HeroMotion, HeroItem } from './hero-motion';

export function Hero({ profile, links }: { profile: Profile; links: SocialLink[] }) {
  const heroLinks = links.filter((l) => l.showInHero);
  return (
    <section id="top" aria-labelledby="hero-title" className="container-page pt-12 pb-24 md:pt-20 md:pb-32">
      <HeroMotion className="grid items-center gap-14 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
        <div className="space-y-8">
          <HeroItem className="flex flex-wrap items-center gap-3">
            <AvailabilityBadge availability={profile.availability} />
            {profile.greeting && <p className="eyebrow">{profile.greeting}</p>}
          </HeroItem>

          <HeroItem>
            <h1
              id="hero-title"
              className="text-[2.6rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[4.25rem]"
            >
              {profile.headline}
            </h1>
          </HeroItem>

          {profile.intro && (
            <HeroItem>
              <p className="max-w-xl text-lg text-pretty text-muted-foreground">{profile.intro}</p>
            </HeroItem>
          )}

          <HeroItem className="flex flex-wrap items-center gap-3">
            <Link href="/projects" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full px-5')}>
              Explore my work
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/#contact"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-full px-5')}
            >
              Get in touch
              <ArrowDownRight data-icon="inline-end" />
            </Link>
            {profile.cv && (
              <a
                href={profile.cv.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), 'h-11 rounded-full px-4')}
              >
                <Download data-icon="inline-start" />
                Download CV
              </a>
            )}
          </HeroItem>

          {heroLinks.length > 0 && (
            <HeroItem>
              <ul className="flex items-center gap-1" aria-label="Social profiles">
                {heroLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={link.label}
                      className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <SocialIcon platform={link.platform} className="size-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </HeroItem>
          )}
        </div>

        <HeroItem className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div
            className="absolute -inset-3 -z-10 translate-x-4 translate-y-4 rounded-[2rem] border border-dashed"
            aria-hidden="true"
          />
          <div className="aspect-[4/5] overflow-hidden rounded-[1.75rem] border bg-subtle shadow-[0_30px_80px_-40px_rgb(0_0_0/0.35)]">
            <CloudImage
              image={profile.avatar ?? FALLBACK_HEADSHOT}
              label={profile.name}
              sizes="(min-width: 1024px) 28rem, 90vw"
              priority
            />
          </div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl border bg-card/95 px-4 py-3 shadow-sm backdrop-blur sm:-left-8">
            <p className="text-sm font-medium">{profile.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {profile.role}
              {profile.location && (
                <>
                  <span aria-hidden="true">·</span>
                  <MapPin className="size-3" aria-hidden="true" />
                  {profile.location}
                </>
              )}
            </p>
          </div>
        </HeroItem>
      </HeroMotion>
    </section>
  );
}
