import type { Metadata } from "next";
import { ProjectEditorPage } from "@/features/admin/pages/project-editor";

export const metadata: Metadata = { title: "New project" };

export default function Page() {
  return <ProjectEditorPage id={null} />;
}
