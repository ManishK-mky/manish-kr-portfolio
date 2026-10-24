import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRows } from "@/features/admin/components/page-header";
import { ProjectEditorPage } from "@/features/admin/pages/project-editor";

export const metadata: Metadata = { title: "Edit project" };

export default function Page({ params }: PageProps<"/admin/projects/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      {params.then(({ id }) => (
        <ProjectEditorPage key={id} id={id} />
      ))}
    </Suspense>
  );
}
