import type { Metadata } from "next";
import { CompaniesPage } from "@/features/admin/pages/companies";

export const metadata: Metadata = { title: "Companies" };

export default function Page() {
  return <CompaniesPage />;
}
