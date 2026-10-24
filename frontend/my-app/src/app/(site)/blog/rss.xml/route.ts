import { SITE_URL } from "@/lib/api/config";
import { getPosts, getSettings } from "@/lib/api/public";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const [settings, { items }] = await Promise.all([getSettings(), getPosts({}, 30)]);
  const base = settings.siteUrl || SITE_URL;
  const entries = items
    .map(
      (p) => `<item>
  <title>${esc(p.title)}</title>
  <link>${base}/blog/${p.slug}</link>
  <guid isPermaLink="true">${base}/blog/${p.slug}</guid>
  ${p.publishedAt ? `<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>` : ""}
  <description>${esc(p.excerpt)}</description>
</item>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(settings.siteName)} — Blog</title>
<link>${base}/blog</link>
<description>${esc(settings.siteDescription)}</description>
${entries}
</channel></rss>`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
