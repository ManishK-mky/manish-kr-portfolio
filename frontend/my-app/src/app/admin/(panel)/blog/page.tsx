import type { Metadata } from "next";
import { BlogListPage } from "@/features/admin/pages/blog-list";

export const metadata: Metadata = { title: "Blog posts" };

export default function Page() {
  return <BlogListPage />;
}
