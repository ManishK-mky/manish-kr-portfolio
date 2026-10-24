'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { fieldErrors } from '@/lib/validation';
import type { Profile } from '@/types/api';
import { FormSection, SelectField, SwitchField, TextAreaField, TextField } from '../components/fields';
import { ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { SaveBar } from '../components/save-bar';
import { useApiQuery, useMutation, useUnsavedChanges } from '../hooks/use-api';
import { DocumentField, ImageField, imagePayload } from '../media/image-field';

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  headline: z.string().trim().min(1, 'Headline is required').max(200),
  role: z.string().max(120),
  greeting: z.string().max(120),
  intro: z.string().max(600),
  bio: z.string().max(8000),
  location: z.string().max(120),
  email: z.union([z.literal(''), z.email('Enter a valid email')]),
});

export function ProfilePage() {
  const { data, error, loading, reload } = useApiQuery<Profile>('/profile');
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !data) return <LoadingRows rows={6} />;
  return <ProfileForm initial={data} />;
}

function ProfileForm({ initial }: { initial: Profile }) {
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useMutation();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  useUnsavedChanges(dirty);

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setValues((v) => ({ ...v, [key]: value }));
  const setAvailability = (patch: Partial<Profile['availability']>) =>
    setValues((v) => ({ ...v, availability: { ...v.availability, ...patch } }));

  async function save() {
    const { errors: errs } = fieldErrors(profileSchema, values);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const updated = await run(
      () =>
        api<Profile>('/profile', {
          method: 'PATCH',
          body: {
            name: values.name,
            role: values.role,
            greeting: values.greeting,
            headline: values.headline,
            intro: values.intro,
            bio: values.bio,
            location: values.location,
            email: values.email,
            availability: values.availability,
            avatar: imagePayload(values.avatar),
            aboutImage: imagePayload(values.aboutImage),
            cvMediaId: values.cv?.mediaId ?? null,
            stats: values.stats.filter((s) => s.value.trim() && s.label.trim()),
          },
        }),
      { success: 'Profile saved' },
    );
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
    >
      <PageHeader title="Profile & hero" description="Your introduction on the home page and the About page." />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <FormSection title="Hero" description="The first thing visitors read.">
            <TextField label="Greeting" value={values.greeting} onChange={(v) => set('greeting', v)} maxLength={120} placeholder="Hi, I’m Alex — a full-stack engineer." />
            <TextAreaField label="Headline" required rows={2} value={values.headline} onChange={(v) => set('headline', v)} maxLength={200} error={errors.headline} />
            <TextAreaField label="Short introduction" rows={3} value={values.intro} onChange={(v) => set('intro', v)} maxLength={600} />
          </FormSection>
          <FormSection title="About" description="Separate paragraphs with a blank line.">
            <TextAreaField label="Bio" rows={10} value={values.bio} onChange={(v) => set('bio', v)} maxLength={8000} />
            <div>
              <p className="mb-2 text-[0.8rem] font-medium">Highlights</p>
              <ul className="space-y-2">
                {values.stats.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <Input
                      aria-label={`Highlight ${i + 1} value`}
                      value={s.value}
                      placeholder="8+"
                      className="h-9 w-24"
                      onChange={(e) => set('stats', values.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                    />
                    <Input
                      aria-label={`Highlight ${i + 1} label`}
                      value={s.label}
                      placeholder="Years building products"
                      className="h-9 flex-1"
                      onChange={(e) => set('stats', values.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    />
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove highlight" onClick={() => set('stats', values.stats.filter((_, j) => j !== i))}>
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
              {values.stats.length < 6 && (
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => set('stats', [...values.stats, { value: '', label: '' }])}>
                  <Plus data-icon="inline-start" /> Add highlight
                </Button>
              )}
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Identity">
            <TextField label="Name" required value={values.name} onChange={(v) => set('name', v)} error={errors.name} />
            <TextField label="Role" value={values.role} onChange={(v) => set('role', v)} placeholder="Full-stack engineer" />
            <TextField label="Location" value={values.location} onChange={(v) => set('location', v)} />
            <TextField label="Public email" type="email" value={values.email} onChange={(v) => set('email', v)} error={errors.email} />
          </FormSection>
          <FormSection title="Availability">
            <SwitchField label="Show availability" description="Displayed in the navigation and hero." checked={values.availability.visible} onChange={(v) => setAvailability({ visible: v })} />
            <SelectField
              label="Status"
              value={values.availability.status}
              onChange={(v) => setAvailability({ status: v })}
              options={[
                { value: 'available', label: 'Available' },
                { value: 'open', label: 'Open to offers' },
                { value: 'unavailable', label: 'Not available' },
              ]}
            />
            <TextField label="Label" value={values.availability.label} onChange={(v) => setAvailability({ label: v })} maxLength={80} />
          </FormSection>
          <FormSection title="Images & CV">
            <ImageField label="Profile picture" folder="profile" aspect="aspect-[4/5]" value={values.avatar} onChange={(v) => set('avatar', v)} />
            <ImageField label="About page image (optional)" folder="profile" aspect="aspect-[4/5]" value={values.aboutImage} onChange={(v) => set('aboutImage', v)} hint="Falls back to the profile picture." />
            <DocumentField
              label="CV (PDF)"
              value={values.cv}
              onChange={(doc) => set('cv', doc ? { ...doc, publicId: values.cv?.publicId ?? '' } : null)}
            />
          </FormSection>
        </div>
      </div>
      <SaveBar dirty={dirty} pending={pending} />
    </form>
  );
}
