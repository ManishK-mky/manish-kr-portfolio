/** Shapes returned by the NestJS API (after its `{ success, data }` envelope). */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: { statusCode: number; code: string; message: string; details?: unknown };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ImageRef {
  mediaId: string;
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  alt: string;
}

export interface GalleryImage extends ImageRef {
  caption: string;
}

export type AvailabilityStatus = 'available' | 'open' | 'unavailable';

export interface Profile {
  id?: string;
  name: string;
  role: string;
  greeting: string;
  headline: string;
  intro: string;
  bio: string;
  avatar: ImageRef | null;
  aboutImage: ImageRef | null;
  location: string;
  email: string;
  availability: { status: AvailabilityStatus; label: string; visible: boolean };
  cv: { mediaId: string; url: string; publicId: string; filename: string } | null;
  stats: { value: string; label: string }[];
  updatedAt?: string;
}

export interface SiteSettings {
  id?: string;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  keywords: string[];
  ogImage: ImageRef | null;
  footerTagline: string;
  contactHeadline: string;
  contactText: string;
  contactFormEnabled: boolean;
  blogEnabled: boolean;
}

export const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'x',
  'email',
  'website',
  'youtube',
  'dribbble',
  'mastodon',
  'bluesky',
  'other',
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
  showInHero: boolean;
  order: number;
}

export interface ChallengeSolution {
  challenge: string;
  solution: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  cover: ImageRef | null;
  gallery?: GalleryImage[];
  technologies: string[];
  category: string;
  githubUrl: string;
  liveUrl: string;
  startDate?: string | null;
  endDate?: string | null;
  role: string;
  responsibilities?: string[];
  challenges?: ChallengeSolution[];
  features?: string[];
  achievements: string[];
  featured: boolean;
  published: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends Project {
  next: Pick<Project, 'id' | 'title' | 'slug' | 'summary' | 'cover'> | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo: ImageRef | null;
  website: string;
  location: string;
  industry: string;
  description: string;
}

export const EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'freelance',
  'internship',
  'self-employed',
] as const;
export const WORK_MODES = ['remote', 'onsite', 'hybrid'] as const;

export interface Experience {
  id: string;
  company: Pick<Company, 'id' | 'name' | 'slug' | 'logo' | 'website' | 'location' | 'industry'>;
  title: string;
  employmentType: (typeof EMPLOYMENT_TYPES)[number];
  location: string;
  workMode: (typeof WORK_MODES)[number];
  startDate: string;
  endDate: string | null;
  current: boolean;
  summary: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  order: number;
}

export interface Education {
  id: string;
  institution: string;
  logo: ImageRef | null;
  website: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string | null;
  endDate?: string | null;
  grade: string;
  coursework: string[];
  achievements: string[];
  activities: string[];
  description: string;
  order: number;
}

export const PROFICIENCY_LEVELS = ['Expert', 'Advanced', 'Proficient', 'Familiar'] as const;
export type Proficiency = (typeof PROFICIENCY_LEVELS)[number];

export interface SkillCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
}

export interface Skill {
  id: string;
  name: string;
  category: string | Pick<SkillCategory, 'id' | 'name' | 'slug' | 'order'>;
  icon: string;
  proficiency: Proficiency | null;
  featured: boolean;
  order: number;
}

export interface SkillGroup extends SkillCategory {
  skills: Skill[];
}

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface Taxonomy {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount?: number;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

/** Tiptap / ProseMirror JSON. */
export interface TiptapDoc {
  type: 'doc';
  content?: unknown[];
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: ImageRef | null;
  readingTime: number;
  wordCount: number;
  author: { name: string; avatarUrl: string };
  category: Pick<Taxonomy, 'id' | 'name' | 'slug'> | null;
  tags: Pick<Taxonomy, 'id' | 'name' | 'slug'>[];
  status: PostStatus;
  publishedAt: string | null;
  featured: boolean;
  seo: { title: string; description: string; canonicalUrl: string };
  createdAt: string;
  updatedAt: string;
}

export interface Post extends PostSummary {
  html: string;
  toc: TocEntry[];
  content?: TiptapDoc;
}

export interface PublicPost extends Post {
  related: Pick<PostSummary, 'id' | 'title' | 'slug' | 'excerpt' | 'coverImage' | 'publishedAt' | 'readingTime'>[];
}

export const MEDIA_FOLDERS = [
  'profile',
  'projects',
  'companies',
  'education',
  'blog',
  'site',
  'documents',
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  resourceType: 'image' | 'raw';
  folder: MediaFolder;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  originalFilename: string;
  alt: string;
  createdAt: string;
  usages?: { source: string; count: number }[];
}

export interface UploadSignature {
  timestamp: number;
  folder: string;
  allowed_formats?: string;
  signature: string;
  apiKey: string;
  cloudName: string;
  resourceType: 'image' | 'raw';
  uploadUrl: string;
  maxBytes: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  lastLoginAt?: string;
}

export interface DashboardStats {
  projects: { total: number; published: number; drafts: number };
  posts: { total: number; published: number; drafts: number; scheduled: number };
  experience: number;
  education: number;
  skills: number;
  media: number;
  unreadMessages: number;
  recentPosts: Pick<PostSummary, 'id' | 'title' | 'slug' | 'status' | 'publishedAt' | 'updatedAt'>[];
}
