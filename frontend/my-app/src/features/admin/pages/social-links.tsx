'use client';

import { Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';
import { SocialIcon } from '@/components/site/social-icon';
import { Button } from '@/components/ui/button';
import { fieldErrors } from '@/lib/validation';
import { SOCIAL_PLATFORMS, type SocialLink, type SocialPlatform } from '@/types/api';
import { ConfirmButton } from '../components/confirm-button';
import { EditDialog } from '../components/edit-dialog';
import { SelectField, SwitchField, TextField } from '../components/fields';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '../components/page-header';
import { ReorderButtons } from '../components/reorder';
import { useCrud } from '../hooks/use-crud';

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  label: z.string().trim().min(1, 'Label is required').max(60),
  url: z
    .string()
    .trim()
    .regex(/^(https?:\/\/\S+|mailto:[^\s@]+@[^\s@]+)$/, 'Use an http(s):// or mailto: link'),
});

type Draft = Omit<SocialLink, 'id' | 'order'>;
const EMPTY: Draft = { platform: 'github', label: 'GitHub', url: '', visible: true, showInHero: false };
const LABELS: Record<SocialPlatform, string> = {
  github: 'GitHub', linkedin: 'LinkedIn', x: 'X', email: 'Email', website: 'Website',
  youtube: 'YouTube', dribbble: 'Dribbble', mastodon: 'Mastodon', bluesky: 'Bluesky', other: 'Other',
};

export function SocialLinksPage() {
  const crud = useCrud<SocialLink>('/social-links', { listPath: '/social-links/admin', entity: 'Link' });
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const items = crud.data ?? [];

  const open = (link?: SocialLink) => {
    setErrors({});
    setEditing(
      link
        ? { id: link.id, draft: { platform: link.platform, label: link.label, url: link.url, visible: link.visible, showInHero: link.showInHero } }
        : { id: null, draft: EMPTY },
    );
  };
  const setDraft = (patch: Partial<Draft>) => setEditing((e) => (e ? { ...e, draft: { ...e.draft, ...patch } } : e));

  return (
    <>
      <PageHeader
        title="Social links"
        description="Shown in the hero, contact section and footer."
        actions={
          <Button onClick={() => open()}>
            <Plus data-icon="inline-start" /> Add link
          </Button>
        }
      />
      {crud.error ? (
        <ErrorState message={crud.error} onRetry={crud.reload} />
      ) : crud.loading && !crud.data ? (
        <LoadingRows />
      ) : items.length === 0 ? (
        <EmptyState title="No links yet" description="Add GitHub, LinkedIn or an email address." />
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((link, i) => (
            <li key={link.id} className="flex items-center gap-3 px-3 py-2.5">
              <ReorderButtons index={i} count={items.length} label={link.label} disabled={crud.pending} onMove={(f, t) => crud.move(items, f, t)} />
              <SocialIcon platform={link.platform} className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {link.label}
                  {link.showInHero && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">Hero</span>}
                </p>
                <p className="truncate text-xs text-muted-foreground">{link.url}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={link.visible ? `Hide ${link.label}` : `Show ${link.label}`}
                onClick={() => crud.save(link.id, { visible: !link.visible })}
              >
                {link.visible ? <Eye /> : <EyeOff className="text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Edit ${link.label}`} onClick={() => open(link)}>
                <Pencil />
              </Button>
              <ConfirmButton
                variant="ghost"
                size="icon-sm"
                ariaLabel={`Delete ${link.label}`}
                title="Delete this link?"
                description={`“${link.label}” will be removed from the site.`}
                onConfirm={() => crud.remove(link.id)}
              >
                <Trash2 />
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EditDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          title={editing.id ? 'Edit link' : 'Add link'}
          pending={crud.pending}
          onSubmit={async () => {
            const { data, errors: errs } = fieldErrors(socialLinkSchema, editing.draft);
            setErrors(errs);
            if (!data) return false;
            return Boolean(await crud.save(editing.id, editing.draft));
          }}
        >
          <SelectField
            label="Platform"
            value={editing.draft.platform}
            options={SOCIAL_PLATFORMS.map((p) => ({ value: p, label: LABELS[p] }))}
            onChange={(platform) =>
              setDraft({
                platform,
                label: !editing.draft.label || Object.values(LABELS).includes(editing.draft.label) ? LABELS[platform] : editing.draft.label,
              })
            }
          />
          <TextField label="Label" required value={editing.draft.label} onChange={(label) => setDraft({ label })} error={errors.label} />
          <TextField
            label="URL"
            required
            value={editing.draft.url}
            onChange={(url) => setDraft({ url })}
            error={errors.url}
            placeholder={editing.draft.platform === 'email' ? 'mailto:you@example.com' : 'https://'}
          />
          <SwitchField label="Visible" checked={editing.draft.visible} onChange={(visible) => setDraft({ visible })} />
          <SwitchField label="Show in hero" description="Icon next to the hero call-to-action buttons." checked={editing.draft.showInHero} onChange={(showInHero) => setDraft({ showInHero })} />
        </EditDialog>
      )}
    </>
  );
}
