import type { Metadata } from "next";
import { SkillsPage } from "@/features/admin/pages/skills";

export const metadata: Metadata = { title: "Skills" };

export default function Page() {
  return <SkillsPage />;
}
