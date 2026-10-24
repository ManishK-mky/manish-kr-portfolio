import { cn } from '@/lib/utils';
import type { Profile } from '@/types/api';

const DOT: Record<Profile['availability']['status'], string> = {
  available: 'bg-success',
  open: 'bg-warning',
  unavailable: 'bg-muted-foreground',
};

export function AvailabilityBadge({
  availability,
  className,
  compact = false,
}: {
  availability: Profile['availability'];
  className?: string;
  compact?: boolean;
}) {
  if (!availability.visible) return null;
  const pulsing = availability.status !== 'unavailable';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        {pulsing && (
          <span className={cn('absolute inline-flex size-full animate-pulse-soft rounded-full', DOT[availability.status])} />
        )}
        <span className={cn('relative inline-flex size-2 rounded-full', DOT[availability.status])} />
      </span>
      <span className={cn(compact && 'max-lg:sr-only')}>{availability.label}</span>
    </span>
  );
}
