'use client';

import { KeyRound } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { fieldErrors } from '@/lib/validation';
import type { SiteSettings } from '@/types/api';
import { FormSection, SwitchField, TagInput, TextAreaField, TextField } from '../components/fields';
import { ErrorState, LoadingRows, PageHeader, Spinner } from '../components/page-header';
import { SaveBar } from '../components/save-bar';
import { useApiQuery, useMutation, useUnsavedChanges } from '../hooks/use-api';
import { ImageField, imagePayload } from '../media/image-field';

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, 'Required').max(80),
  siteTitle: z.string().trim().min(1, 'Required').max(120),
  siteDescription: z.string().max(300),
  siteUrl: z.union([z.literal(''), z.url({ protocol: /^https?$/, message: 'Enter a full URL, e.g. https://example.com' })]),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(12, 'Use at least 12 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });

export function SettingsPage() {
  const { data, error, loading, reload } = useApiQuery<SiteSettings>('/settings/public');
  return (
    <>
      <PageHeader title="Settings" description="Site-wide SEO, footer and feature switches." />
      {error ? <ErrorState message={error} onRetry={reload} /> : loading || !data ? <LoadingRows /> : <SettingsForm initial={data} />}
      <PasswordForm />
    </>
  );
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useMutation();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);
  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setValues((s) => ({ ...s, [k]: v }));

  async function save() {
    const { errors: errs } = fieldErrors(settingsSchema, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const rest = values;
    const body = {
      siteName: rest.siteName,
      siteTitle: rest.siteTitle,
      siteDescription: rest.siteDescription,
      siteUrl: rest.siteUrl,
      keywords: rest.keywords,
      ogImage: imagePayload(rest.ogImage),
      footerTagline: rest.footerTagline,
      contactHeadline: rest.contactHeadline,
      contactText: rest.contactText,
      contactFormEnabled: rest.contactFormEnabled,
      blogEnabled: rest.blogEnabled,
    };
    const updated = await run(() => api<SiteSettings>('/settings', { method: 'PATCH', body }), { success: 'Settings saved' });
    if (updated) {
      setValues(updated);
      setSaved(updated);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <FormSection title="SEO" description="Defaults for search engines and link previews.">
          <TextField label="Site name" required value={values.siteName} onChange={(v) => set('siteName', v)} error={errors.siteName} />
          <TextField label="Default page title" required value={values.siteTitle} onChange={(v) => set('siteTitle', v)} error={errors.siteTitle} />
          <TextAreaField label="Description" rows={3} maxLength={300} value={values.siteDescription} onChange={(v) => set('siteDescription', v)} />
          <TextField label="Canonical site URL" value={values.siteUrl} onChange={(v) => set('siteUrl', v)} placeholder="https://example.com" error={errors.siteUrl} hint="Used for canonical links, the sitemap and share links." />
          <TagInput label="Keywords" value={values.keywords} onChange={(v) => set('keywords', v)} />
          <ImageField label="Default social image" folder="site" value={values.ogImage} onChange={(v) => set('ogImage', v)} hint="1200 × 630 works best." />
        </FormSection>
        <div className="space-y-6">
          <FormSection title="Contact section">
            <TextField label="Headline" value={values.contactHeadline} onChange={(v) => set('contactHeadline', v)} maxLength={200} />
            <TextAreaField label="Text" rows={4} maxLength={600} value={values.contactText} onChange={(v) => set('contactText', v)} />
            <SwitchField label="Contact form" description="Show the form; messages appear under Messages." checked={values.contactFormEnabled} onChange={(v) => set('contactFormEnabled', v)} />
          </FormSection>
          <FormSection title="Footer & features">
            <TextField label="Footer tagline" value={values.footerTagline} onChange={(v) => set('footerTagline', v)} maxLength={200} />
            <SwitchField label="Blog" description="Show writing on the home page and in the sitemap." checked={values.blogEnabled} onChange={(v) => set('blogEnabled', v)} />
          </FormSection>
        </div>
      </div>
      <SaveBar dirty={dirty} pending={pending} />
    </form>
  );
}

function PasswordForm() {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useMutation();

  return (
    <form
      className="mt-10"
      onSubmit={async (e) => {
        e.preventDefault();
        const { data, errors: errs } = fieldErrors(passwordSchema, values);
        setErrors(errs);
        if (!data) return;
        const ok = await run(
          () => api('/auth/password', { method: 'PATCH', body: { currentPassword: data.currentPassword, newPassword: data.newPassword } }),
          { success: 'Password changed. Other devices were signed out.' },
        );
        if (ok) setValues({ currentPassword: '', newPassword: '', confirm: '' });
      }}
    >
      <FormSection title="Password" description="Changing it signs you out everywhere else." className="max-w-xl">
        <TextField label="Current password" type="password" value={values.currentPassword} onChange={(v) => setValues((s) => ({ ...s, currentPassword: v }))} error={errors.currentPassword} />
        <TextField label="New password" type="password" value={values.newPassword} onChange={(v) => setValues((s) => ({ ...s, newPassword: v }))} error={errors.newPassword} hint="At least 12 characters. A passphrase works well." />
        <TextField label="Confirm new password" type="password" value={values.confirm} onChange={(v) => setValues((s) => ({ ...s, confirm: v }))} error={errors.confirm} />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? <Spinner /> : <KeyRound data-icon="inline-start" />}
          Change password
        </Button>
      </FormSection>
    </form>
  );
}
