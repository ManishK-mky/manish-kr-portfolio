'use client';

import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { errorMessage, publicApi } from '@/lib/api/client';
import { fieldErrors } from '@/lib/validation';
import { contactSchema } from './contact-schema';

type Status = 'idle' | 'sending' | 'sent' | 'error';

function ErrorText({ name, errors }: { name: string; errors: Record<string, string> }) {
  if (!errors[name]) return null;
  return (
    <p id={`contact-${name}-error`} className="text-xs text-destructive">
      {errors[name]}
    </p>
  );
}

export function ContactForm() {
  const startedAt = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values = Object.fromEntries(form) as Record<string, string>;
    const { data, errors: errs } = fieldErrors(contactSchema, values);
    setErrors(errs);
    if (!data) return;

    setStatus('sending');
    setServerError('');
    try {
      await publicApi('/contact', {
        method: 'POST',
        body: {
          ...data,
          subject: data.subject || undefined,
          website: values.website ?? '',
          startedAt: startedAt.current ?? Date.now(),
        },
      });
      setStatus('sent');
    } catch (err) {
      setServerError(errorMessage(err));
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-8">
        <CheckCircle2 className="size-6 text-success" aria-hidden="true" />
        <p className="text-lg font-medium">Thanks — your message is on its way.</p>
        <p className="text-sm text-muted-foreground">I usually reply within two working days.</p>
        <Button variant="outline" size="sm" onClick={() => setStatus('idle')}>
          Send another
        </Button>
      </div>
    );
  }

  const fieldProps = (name: string) => ({
    id: `contact-${name}`,
    name,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <form
      onSubmit={onSubmit}
      onFocus={() => {
        startedAt.current ??= Date.now();
      }}
      noValidate
      className="space-y-5 rounded-2xl border bg-card p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input {...fieldProps('name')} autoComplete="name" className="h-10" />
          <ErrorText name="name" errors={errors} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input {...fieldProps('email')} type="email" autoComplete="email" className="h-10" />
          <ErrorText name="email" errors={errors} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject">
          Subject <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input {...fieldProps('subject')} className="h-10" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea {...fieldProps('message')} rows={6} />
        <ErrorText name="message" errors={errors} />
      </div>
      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11 rounded-full px-5" disabled={status === 'sending'}>
        {status === 'sending' ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <Send data-icon="inline-start" />
        )}
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
