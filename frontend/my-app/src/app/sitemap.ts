import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/api/config";
import { getPostSlugs, getProjectSlugs, getSettings } from "@/lib/api/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, projects, posts] = await Promise.all([getSettings(), getProjectSlugs(), getPostSlugs()]);
  const base = settings.siteUrl || SITE_URL;
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.7 },
  ];
  if (settings.blogEnabled) staticPages.push({ url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 });

  return [
    ...staticPages,
    ...projects.map((p) => ({
      url: `${base}/projects/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    ...(settings.blogEnabled
      ? posts.map((p) => ({
          url: `${base}/blog/${p.slug}`,
          lastModified: p.updatedAt ?? p.publishedAt,
          changeFrequency: "yearly" as const,
          priority: 0.6,
        }))
      : []),
  ];
}
