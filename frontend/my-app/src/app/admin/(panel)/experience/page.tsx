import type { Metadata } from "next";
import { ExperiencePage } from "@/features/admin/pages/experience";

export const metadata: Metadata = { title: "Experience" };

export default function Page() {
  return <ExperiencePage />;
}
