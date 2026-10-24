import { ArrowUpRight, Mail } from 'lucide-react';
import { Reveal } from '@/components/motion/reveal';
import { SocialIcon } from '@/components/site/social-icon';
import type { Profile, SiteSettings, SocialLink } from '@/types/api';
import { ContactForm } from './contact-form';

export function ContactSection({
  profile,
  settings,
  links,
}: {
  profile: Profile;
  settings: SiteSettings;
  links: SocialLink[];
}) {
  const profiles = links.filter((l) => l.platform !== 'email');
  return (
    <section id="contact" aria-labelledby="contact-title" className="container-page py-24">
      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="space-y-8">
          <p className="eyebrow flex items-center gap-3">
            <span className="text-brand">06</span>
            <span className="h-px w-8 bg-border" aria-hidden="true" />
            Contact
          </p>
          <h2 id="contact-title" className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            {settings.contactHeadline}
          </h2>
          {settings.contactText && <p className="max-w-md text-pretty text-muted-foreground">{settings.contactText}</p>}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="group inline-flex items-center gap-3 text-xl font-medium tracking-tight md:text-2xl"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-brand text-brand-foreground">
                <Mail className="size-4" aria-hidden="true" />
              </span>
              <span className="underline decoration-border decoration-1 underline-offset-8 transition-colors group-hover:decoration-brand">
                {profile.email}
              </span>
            </a>
          )}
          {profiles.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {profiles.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    <SocialIcon platform={link.platform} className="size-4" />
                    {link.label}
                    <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
        {settings.contactFormEnabled && (
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        )}
      </div>
    </section>
  );
}
