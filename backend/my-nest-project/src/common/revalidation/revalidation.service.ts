import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service.js';

/** Cache tags shared with the Next.js frontend (see frontend/src/lib/api/tags.ts). */
export const Tags = {
  profile: 'profile',
  settings: 'settings',
  socialLinks: 'social-links',
  projects: 'projects',
  project: (slug: string) => `project:${slug}`,
  companies: 'companies',
  experience: 'experience',
  education: 'education',
  skills: 'skills',
  blog: 'blog',
  post: (slug: string) => `post:${slug}`,
  blogTaxonomy: 'blog-taxonomy',
} as const;

/**
 * Notifies the frontend that published content changed so its cached pages are
 * revalidated immediately instead of waiting for the cache lifetime to expire.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: AppConfigService) {}

  /** Fire-and-forget: a failed webhook must never fail the admin's write. */
  trigger(...tags: string[]): void {
    void this.send(tags);
  }

  async send(tags: string[]): Promise<boolean> {
    const { url, secret } = this.config.revalidation;
    const unique = [...new Set(tags)].filter(Boolean);
    if (!url || !secret || unique.length === 0) return false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({ tags: unique }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        this.logger.warn(`Revalidation webhook responded ${res.status}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(
        `Revalidation webhook failed: ${err instanceof Error ? err.message : String(err)}`,
      );
      return false;
    }
  }
}
