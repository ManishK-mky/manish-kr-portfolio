import type { Metadata } from "next";
import { SocialLinksPage } from "@/features/admin/pages/social-links";

export const metadata: Metadata = { title: "Social links" };

export default function Page() {
  return <SocialLinksPage />;
}
