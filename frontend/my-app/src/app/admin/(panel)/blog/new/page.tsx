import type { Metadata } from "next";
import { BlogEditorPage } from "@/features/admin/pages/blog-editor";

export const metadata: Metadata = { title: "New post" };

export default function Page() {
  return <BlogEditorPage id={null} />;
}
