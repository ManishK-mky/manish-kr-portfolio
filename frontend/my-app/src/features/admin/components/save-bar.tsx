'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Spinner } from './page-header';

/** Sticky footer with the primary save action and an unsaved-changes hint. */
export function SaveBar({
  dirty,
  pending,
  onSave,
  label = 'Save changes',
  extra,
}: {
  dirty: boolean;
  pending: boolean;
  onSave?: () => void;
  label?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-4 z-20 mt-8 flex items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur transition-opacity',
        !dirty && !extra && 'opacity-80',
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {dirty ? 'You have unsaved changes' : 'All changes saved'}
      </p>
      <div className="flex items-center gap-2">
        {extra}
        <Button type={onSave ? 'button' : 'submit'} onClick={onSave} disabled={pending || !dirty}>
          {pending ? <Spinner /> : <Save data-icon="inline-start" />}
          {label}
        </Button>
      </div>
    </div>
  );
}
