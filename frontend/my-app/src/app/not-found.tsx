import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main id="main" className="container-page flex min-h-[80vh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow">Error 404</p>
      <h1 className="max-w-xl text-5xl font-semibold tracking-[-0.03em] text-balance md:text-6xl">
        This page doesn’t exist — or it moved.
      </h1>
      <p className="max-w-md text-muted-foreground">
        The link may be outdated, or the content may have been unpublished.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-11 rounded-full px-5")}>
          <ArrowLeft data-icon="inline-start" /> Back home
        </Link>
        <Link href="/projects" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 rounded-full px-5")}>
          Browse projects
        </Link>
      </div>
    </main>
  );
}
