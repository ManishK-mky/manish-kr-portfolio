import type { Metadata } from "next";
import { ProfilePage } from "@/features/admin/pages/profile";

export const metadata: Metadata = { title: "Profile & hero" };

export default function Page() {
  return <ProfilePage />;
}
