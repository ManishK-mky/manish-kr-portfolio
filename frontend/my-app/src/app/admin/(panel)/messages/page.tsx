import type { Metadata } from "next";
import { MessagesPage } from "@/features/admin/pages/messages";

export const metadata: Metadata = { title: "Messages" };

export default function Page() {
  return <MessagesPage />;
}
