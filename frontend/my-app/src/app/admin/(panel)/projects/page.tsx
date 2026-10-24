import type { Metadata } from "next";
import { ProjectsListPage } from "@/features/admin/pages/projects-list";

export const metadata: Metadata = { title: "Projects" };

export default function Page() {
  return <ProjectsListPage />;
}
