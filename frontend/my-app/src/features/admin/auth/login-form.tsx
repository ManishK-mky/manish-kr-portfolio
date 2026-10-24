'use client';

import { Loader2, LockKeyhole } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldErrors } from '@/lib/validation';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useAuth } from './auth-provider';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

/** Only same-app admin paths are accepted as a post-login redirect. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
}

export function LoginForm() {
  const { status, login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data, errors: errs } = fieldErrors(loginSchema, Object.fromEntries(new FormData(e.currentTarget)));
    setErrors(errs);
    setFormError('');
    if (!data) return;
    setPending(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : errorMessage(err),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-2">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted">
          <LockKeyhole className="size-4" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">Sign in to the dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage your portfolio content.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="h-10"
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className="h-10"
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>
      {formError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" className="h-10 w-full" disabled={pending || status === 'loading'}>
        {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
        Sign in
      </Button>
    </form>
  );
}
