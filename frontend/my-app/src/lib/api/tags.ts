/** Cache tags — must match backend/src/common/revalidation/revalidation.service.ts. */
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

const STATIC_TAGS = new Set<string>(
  Object.values(Tags).filter((t) => typeof t === 'string') as string[],
);

/** Accepts only tags this app actually uses, so the webhook can't purge arbitrary keys. */
export function isKnownTag(tag: unknown): tag is string {
  if (typeof tag !== 'string' || tag.length > 200) return false;
  return STATIC_TAGS.has(tag) || /^(project|post):[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag);
}
