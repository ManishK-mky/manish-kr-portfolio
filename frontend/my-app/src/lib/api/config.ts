/**
 * API base URLs.
 *
 * - Browser: NEXT_PUBLIC_API_URL, default "/api/v1". The relative default is
 *   proxied to the backend by a rewrite in next.config.ts, which keeps the
 *   refresh-token cookie first-party (no third-party cookie issues).
 * - Server: API_INTERNAL_URL — the backend's real URL, used for SSR and for the
 *   rewrite target. Never exposed to the browser.
 */
const DEFAULT_BACKEND = 'http://localhost:4000/api/v1';

const trim = (url: string) => url.replace(/\/+$/, '');

export function serverApiUrl(): string {
  const internal = process.env.API_INTERNAL_URL;
  const pub = process.env.NEXT_PUBLIC_API_URL;
  if (internal) return trim(internal);
  if (pub && /^https?:\/\//.test(pub)) return trim(pub);
  return DEFAULT_BACKEND;
}

export function browserApiUrl(): string {
  return trim(process.env.NEXT_PUBLIC_API_URL || '/api/v1');
}

export const SITE_URL = trim(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
