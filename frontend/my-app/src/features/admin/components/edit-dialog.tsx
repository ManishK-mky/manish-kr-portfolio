'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Spinner } from './page-header';

/** Modal form wrapper with Save/Cancel; `onSubmit` returns true to close. */
export function EditDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onSubmit,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  pending: boolean;
  onSubmit: () => Promise<boolean> | boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className={wide ? 'max-h-[92vh] overflow-y-auto sm:max-w-2xl' : 'max-h-[92vh] overflow-y-auto sm:max-w-lg'}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await onSubmit()) onOpenChange(false);
          }}
          className="space-y-5"
          noValidate
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <div className="space-y-4">{children}</div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
