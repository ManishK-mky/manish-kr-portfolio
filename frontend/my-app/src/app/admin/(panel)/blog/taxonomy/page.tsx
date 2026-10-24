import type { Metadata } from "next";
import { BlogTaxonomyPage } from "@/features/admin/pages/blog-taxonomy";

export const metadata: Metadata = { title: "Categories & tags" };

export default function Page() {
  return <BlogTaxonomyPage />;
}
