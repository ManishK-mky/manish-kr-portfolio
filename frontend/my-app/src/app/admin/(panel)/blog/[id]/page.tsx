import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRows } from "@/features/admin/components/page-header";
import { BlogEditorPage } from "@/features/admin/pages/blog-editor";

export const metadata: Metadata = { title: "Edit post" };

export default function Page({ params }: PageProps<"/admin/blog/[id]">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      {params.then(({ id }) => (
        <BlogEditorPage key={id} id={id} />
      ))}
    </Suspense>
  );
}
