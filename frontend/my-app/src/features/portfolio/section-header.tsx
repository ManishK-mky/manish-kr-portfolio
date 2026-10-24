import { cn } from '@/lib/utils';

export function SectionHeader({
  id,
  index,
  eyebrow,
  title,
  description,
  action,
  className,
  as: Heading = 'h2',
}: {
  id?: string;
  index?: string;
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cn('mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between', className)}>
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow flex items-center gap-3">
          {index && <span className="text-brand">{index}</span>}
          <span className="h-px w-8 bg-border" aria-hidden="true" />
          {eyebrow}
        </p>
        <Heading id={id} className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</Heading>
        {description && <p className="text-pretty text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
