import { Suspense } from "react";
import { Spinner } from "@/features/admin/components/page-header";
import { AdminShell } from "@/features/admin/shell/admin-shell";

/**
 * The dashboard is client-rendered behind the auth check, so the whole shell
 * (which reads the URL) streams in behind this boundary.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
