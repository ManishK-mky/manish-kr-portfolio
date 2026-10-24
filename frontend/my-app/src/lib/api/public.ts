import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type {
  ApiSuccess,
  Education,
  Experience,
  Paginated,
  Profile,
  Project,
  ProjectDetail,
  PostSummary,
  PublicPost,
  SiteSettings,
  SkillGroup,
  SocialLink,
  Taxonomy,
} from '@/types/api';
import { serverApiUrl } from './config';
import { Tags } from './tags';

/**
 * Cached, server-only readers for public content.
 *
 * Each reader is tagged so the backend's revalidation webhook can refresh it
 * the moment an admin publishes a change. If the API is unreachable (for
 * example during a build without a backend), readers fall back to empty data
 * with a short cache lifetime so the site heals itself once the API is back.
 */

class NotFound extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${serverApiUrl()}${path}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 404) throw new NotFound(path);
  if (!res.ok) throw new Error(`API ${res.status} for ${path}`);
  const body = (await res.json()) as ApiSuccess<T>;
  return body.data;
}

function logFailure(path: string, err: unknown) {
  if (err instanceof NotFound) return;
  console.warn(`[api] ${path} unavailable: ${err instanceof Error ? err.message : err}`);
}

export const FALLBACK_PROFILE: Profile = {
  name: 'Your Name',
  role: 'Full-stack engineer',
  greeting: 'Hi there —',
  headline: 'Building thoughtful digital experiences through code and design.',
  intro: '',
  bio: '',
  avatar: null,
  aboutImage: null,
  location: '',
  email: '',
  availability: { status: 'available', label: 'Available for new projects', visible: false },
  cv: null,
  stats: [],
};

export const FALLBACK_SETTINGS: SiteSettings = {
  siteName: 'Portfolio',
  siteTitle: 'Portfolio',
  siteDescription: 'Personal portfolio and writing.',
  siteUrl: '',
  keywords: [],
  ogImage: null,
  footerTagline: '',
  contactHeadline: 'Let’s build something thoughtful together.',
  contactText: '',
  contactFormEnabled: true,
  blogEnabled: true,
};

const emptyPage = <T>(limit: number): Paginated<T> => ({
  items: [],
  meta: { page: 1, limit, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
});

export async function getProfile(): Promise<Profile> {
  'use cache';
  cacheTag(Tags.profile);
  try {
    const data = await get<Profile>('/profile');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/profile', err);
    cacheLife('minutes');
    return FALLBACK_PROFILE;
  }
}

export async function getSettings(): Promise<SiteSettings> {
  'use cache';
  cacheTag(Tags.settings);
  try {
    const data = await get<SiteSettings>('/settings/public');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/settings/public', err);
    cacheLife('minutes');
    return FALLBACK_SETTINGS;
  }
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  'use cache';
  cacheTag(Tags.socialLinks);
  try {
    const data = await get<SocialLink[]>('/social-links');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/social-links', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getFeaturedProjects(limit = 4): Promise<Project[]> {
  'use cache';
  cacheTag(Tags.projects);
  try {
    const data = await get<Project[]>(`/projects/featured?limit=${limit}`);
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/projects/featured', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getProjects(page = 1, category?: string): Promise<Paginated<Project>> {
  'use cache';
  cacheTag(Tags.projects);
  const qs = new URLSearchParams({ page: String(page), limit: '12' });
  if (category) qs.set('category', category);
  try {
    const data = await get<Paginated<Project>>(`/projects?${qs}`);
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/projects', err);
    cacheLife('minutes');
    return emptyPage(12);
  }
}

export async function getProjectFacets(): Promise<{ categories: string[]; technologies: string[] }> {
  'use cache';
  cacheTag(Tags.projects);
  try {
    const data = await get<{ categories: string[]; technologies: string[] }>('/projects/facets');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/projects/facets', err);
    cacheLife('minutes');
    return { categories: [], technologies: [] };
  }
}

/** All published slugs, for static params and the sitemap. */
export async function getProjectSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  'use cache';
  cacheTag(Tags.projects);
  try {
    const data = await get<Paginated<Project>>('/projects?limit=100');
    cacheLife('hours');
    return data.items.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
  } catch (err) {
    logFailure('/projects', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  'use cache';
  cacheTag(Tags.projects, Tags.project(slug));
  try {
    const data = await get<ProjectDetail>(`/projects/${encodeURIComponent(slug)}`);
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure(`/projects/${slug}`, err);
    if (err instanceof NotFound) cacheLife('hours');
    else cacheLife('minutes');
    return null;
  }
}

export async function getExperience(): Promise<Experience[]> {
  'use cache';
  cacheTag(Tags.experience, Tags.companies);
  try {
    const data = await get<Experience[]>('/experience');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/experience', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getEducation(): Promise<Education[]> {
  'use cache';
  cacheTag(Tags.education);
  try {
    const data = await get<Education[]>('/education');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/education', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getSkillGroups(): Promise<SkillGroup[]> {
  'use cache';
  cacheTag(Tags.skills);
  try {
    const data = await get<SkillGroup[]>('/skills?grouped=true');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/skills', err);
    cacheLife('minutes');
    return [];
  }
}

export interface PostListQuery {
  page?: number;
  search?: string;
  category?: string;
  tag?: string;
}

export async function getPosts(query: PostListQuery = {}, limit = 9): Promise<Paginated<PostSummary>> {
  'use cache';
  cacheTag(Tags.blog);
  const qs = new URLSearchParams({ page: String(query.page ?? 1), limit: String(limit) });
  if (query.search) qs.set('search', query.search);
  if (query.category) qs.set('category', query.category);
  if (query.tag) qs.set('tag', query.tag);
  try {
    const data = await get<Paginated<PostSummary>>(`/blog?${qs}`);
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/blog', err);
    cacheLife('minutes');
    return emptyPage(limit);
  }
}

export async function getPost(slug: string): Promise<PublicPost | null> {
  'use cache';
  cacheTag(Tags.blog, Tags.post(slug));
  try {
    const data = await get<PublicPost>(`/blog/${encodeURIComponent(slug)}`);
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure(`/blog/${slug}`, err);
    if (err instanceof NotFound) cacheLife('hours');
    else cacheLife('minutes');
    return null;
  }
}

export async function getPostSlugs(): Promise<{ slug: string; publishedAt: string; updatedAt: string }[]> {
  'use cache';
  cacheTag(Tags.blog);
  try {
    const data = await get<{ slug: string; publishedAt: string; updatedAt: string }[]>('/blog/sitemap');
    cacheLife('hours');
    return data;
  } catch (err) {
    logFailure('/blog/sitemap', err);
    cacheLife('minutes');
    return [];
  }
}

export async function getBlogTaxonomy(): Promise<{ categories: Taxonomy[]; tags: Taxonomy[] }> {
  'use cache';
  cacheTag(Tags.blog, Tags.blogTaxonomy);
  try {
    const [categories, tags] = await Promise.all([
      get<Taxonomy[]>('/blog/categories'),
      get<Taxonomy[]>('/blog/tags'),
    ]);
    cacheLife('hours');
    return { categories, tags };
  } catch (err) {
    logFailure('/blog/taxonomy', err);
    cacheLife('minutes');
    return { categories: [], tags: [] };
  }
}

/** The current year, cached so footers stay prerenderable. */
export async function getCurrentYear(): Promise<number> {
  'use cache';
  cacheLife('days');
  return new Date().getFullYear();
}
