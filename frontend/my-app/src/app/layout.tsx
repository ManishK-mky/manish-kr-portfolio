import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/api/config";
import { getSettings } from "@/lib/api/public";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = settings.siteUrl || SITE_URL;
  return {
    metadataBase: new URL(base),
    title: { default: settings.siteTitle, template: `%s — ${settings.siteName}` },
    description: settings.siteDescription,
    keywords: settings.keywords,
    applicationName: settings.siteName,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      title: settings.siteTitle,
      description: settings.siteDescription,
      url: "/",
      images: settings.ogImage ? [{ url: settings.ogImage.url, alt: settings.ogImage.alt }] : undefined,
    },
    twitter: { card: "summary_large_image", title: settings.siteTitle, description: settings.siteDescription },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#151412" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
