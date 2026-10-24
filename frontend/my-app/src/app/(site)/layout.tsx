import { Suspense } from "react";
import { AvailabilityBadge } from "@/components/site/availability";
import { Footer } from "@/components/site/footer";
import { Navbar, NavbarFallback } from "@/components/site/navbar";
import { getProfile, getSettings, getSocialLinks } from "@/lib/api/public";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [profile, settings, links] = await Promise.all([getProfile(), getSettings(), getSocialLinks()]);
  const availability = <AvailabilityBadge availability={profile.availability} compact />;
  return (
    <>
      <Suspense fallback={<NavbarFallback name={profile.name} availability={availability} />}>
        <Navbar name={profile.name} availability={availability} />
      </Suspense>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer profile={profile} settings={settings} links={links} />
    </>
  );
}
