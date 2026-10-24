import type { Metadata } from "next";
import { EducationPage } from "@/features/admin/pages/education";

export const metadata: Metadata = { title: "Education" };

export default function Page() {
  return <EducationPage />;
}
