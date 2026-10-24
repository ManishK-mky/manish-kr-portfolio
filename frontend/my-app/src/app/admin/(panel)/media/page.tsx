import type { Metadata } from "next";
import { MediaLibraryPage } from "@/features/admin/pages/media-library";

export const metadata: Metadata = { title: "Media library" };

export default function Page() {
  return <MediaLibraryPage />;
}
