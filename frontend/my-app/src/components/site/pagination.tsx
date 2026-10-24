import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { PaginationMeta } from '@/types/api';

/** Link-based pagination; `href(page)` builds each page's URL. */
export function Pagination({ meta, href }: { meta: PaginationMeta; href: (page: number) => string }) {
  if (meta.totalPages <= 1) return null;
  const linkClass = 'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent';
  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-between">
      {meta.hasPrevPage ? (
        <Link href={href(meta.page - 1)} className={linkClass} rel="prev">
          <ArrowLeft className="size-4" aria-hidden="true" /> Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="font-mono text-xs text-muted-foreground">
        Page {meta.page} of {meta.totalPages}
      </p>
      {meta.hasNextPage ? (
        <Link href={href(meta.page + 1)} className={cn(linkClass)} rel="next">
          Older <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
