'use client';

import { Check, Link2 } from 'lucide-react';
import { useState } from 'react';
import { SocialIcon } from '@/components/site/social-icon';

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const targets = [
    { platform: 'x' as const, label: 'Share on X', href: `https://x.com/intent/post?url=${enc(url)}&text=${enc(title)}` },
    {
      platform: 'linkedin' as const,
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
  ];
  const btn =
    'inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';
  return (
    <div className="flex items-center gap-2">
      <span className="eyebrow mr-1">Share</span>
      {targets.map((t) => (
        <a key={t.platform} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={t.label} className={btn}>
          <SocialIcon platform={t.platform} className="size-3.5" />
        </a>
      ))}
      <button
        type="button"
        className={btn}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt('Copy this link', url);
          }
        }}
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Link2 className="size-3.5" />}
      </button>
      <span className="sr-only" role="status">
        {copied ? 'Link copied to clipboard' : ''}
      </span>
    </div>
  );
}
