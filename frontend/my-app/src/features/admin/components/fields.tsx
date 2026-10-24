'use client';

import { X } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid?: true }) => React.ReactNode;
}

/** Label + control + hint/error, wired up for assistive tech. */
export function Field({ label, error, hint, required, className, children }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id} className="text-[0.8rem]">
        {label}
        {required && <span className="text-destructive" aria-hidden="true">*</span>}
      </Label>
      {children({ id, describedBy, invalid: error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

type Common = { label: string; error?: string; hint?: React.ReactNode; required?: boolean; className?: string };

export function TextField({
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  ...rest
}: Common & {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field {...rest}>
      {({ id, describedBy, invalid }) => (
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          className="h-9"
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
  ...rest
}: Common & {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field
      {...rest}
      hint={
        rest.hint ??
        (maxLength ? (
          <span>
            {value.length}/{maxLength}
          </span>
        ) : undefined)
      }
    >
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/** One item per line, edited as a textarea and stored as string[]. */
export function ListField({
  value,
  onChange,
  rows = 4,
  ...rest
}: Common & { value: string[]; onChange: (v: string[]) => void; rows?: number }) {
  const [text, setText] = useState(value.join('\n'));
  const toList = (t: string) =>
    t
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  // Adopt external changes (e.g. a reset) without fighting the user's typing.
  if (toList(text).join('\n') !== value.join('\n')) setText(value.join('\n'));
  return (
    <Field {...rest} hint={rest.hint ?? 'One item per line'}>
      {({ id, describedBy, invalid }) => (
        <Textarea
          id={id}
          rows={rows}
          value={text}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => {
            setText(e.target.value);
            onChange(toList(e.target.value));
          }}
        />
      )}
    </Field>
  );
}

/** Chip input: Enter or comma adds, Backspace on empty removes the last chip. */
export function TagInput({
  value,
  onChange,
  placeholder = 'Type and press Enter',
  ...rest
}: Common & { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()));
    if (items.length) onChange([...value, ...items]);
    setDraft('');
  };
  return (
    <Field {...rest}>
      {({ id, describedBy, invalid }) => (
        <div
          className={cn(
            'flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1.5 focus-within:ring-3 focus-within:ring-ring/50',
            invalid && 'border-destructive',
          )}
        >
          {value.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            placeholder={value.length ? '' : placeholder}
            aria-describedby={describedBy}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => draft && add(draft)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add(draft);
              } else if (e.key === 'Backspace' && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  ...rest
}: Common & {
  value: T | '';
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field {...rest}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value as T)}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
  className,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('flex items-start justify-between gap-4 rounded-lg border p-3', className)}>
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(v)} />
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border bg-card p-5 md:p-6', className)}>
      <div className="mb-5">
        <h2 className="font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
