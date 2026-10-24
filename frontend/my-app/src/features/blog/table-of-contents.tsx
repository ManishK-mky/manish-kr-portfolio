'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TocEntry } from '@/types/api';

/** Sticky contents list that highlights the heading currently being read. */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState(entries[0]?.id);

  useEffect(() => {
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter((o) => o.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px' },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;
  const minLevel = Math.min(...entries.map((e) => e.level));

  return (
    <nav aria-label="Table of contents" className="text-sm">
      <p className="eyebrow mb-4">On this page</p>
      <ol className="space-y-2 border-l">
        {entries.map((e) => (
          <li key={e.id}>
            <a
              href={`#${e.id}`}
              aria-current={active === e.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l border-transparent py-0.5 text-muted-foreground transition-colors hover:text-foreground',
                active === e.id && 'border-brand text-foreground',
              )}
              style={{ paddingLeft: `${(e.level - minLevel) * 0.75 + 1}rem` }}
            >
              {e.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
