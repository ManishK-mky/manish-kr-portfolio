"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-start justify-center gap-5 py-24" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="text-4xl font-semibold tracking-tight">We couldn’t load this page.</h1>
      <p className="max-w-md text-muted-foreground">
        It’s probably temporary. Try again in a moment.
        {error.digest && <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span>}
      </p>
      <Button size="lg" className="h-11 rounded-full px-5" onClick={() => retry()}>
        <RotateCcw data-icon="inline-start" /> Try again
      </Button>
    </div>
  );
}
