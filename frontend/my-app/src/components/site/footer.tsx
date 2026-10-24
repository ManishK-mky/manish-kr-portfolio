import Link from 'next/link';
import { getCurrentYear } from '@/lib/api/public';
import type { Profile, SiteSettings, SocialLink } from '@/types/api';
import { BackToTop } from './back-to-top';
import { NAV_ITEMS } from './nav-links';
import { SocialIcon } from './social-icon';

export async function Footer({
  profile,
  settings,
  links,
}: {
  profile: Profile;
  settings: SiteSettings;
  links: SocialLink[];
}) {
  const year = await getCurrentYear();
  return (
    <footer className="mt-32 border-t">
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-tight">{profile.name}</p>
          {settings.footerTagline && (
            <p className="max-w-xs text-sm text-muted-foreground">{settings.footerTagline}</p>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-block text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              {profile.email}
            </a>
          )}
        </div>
        <nav aria-label="Footer">
          <p className="eyebrow mb-4">Navigate</p>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="eyebrow mb-4">Elsewhere</p>
          <ul className="space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer me"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <SocialIcon platform={link.platform} className="size-3.5" />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="container-page flex flex-col-reverse items-start justify-between gap-4 border-t py-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
        <p>
          © {year} {profile.name}. All rights reserved.
        </p>
        <BackToTop />
      </div>
    </footer>
  );
}
