import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingRows } from "@/features/admin/components/page-header";
import { BlogPreviewPage } from "@/features/admin/pages/blog-preview";

export const metadata: Metadata = { title: "Preview" };

export default function Page({ params }: PageProps<"/admin/blog/[id]/preview">) {
  return (
    <Suspense fallback={<LoadingRows rows={8} />}>
      {params.then(({ id }) => (
        <BlogPreviewPage id={id} />
      ))}
    </Suspense>
  );
}
