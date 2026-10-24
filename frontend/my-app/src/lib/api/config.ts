/**
 * API base URLs.
 *
 * - Browser: NEXT_PUBLIC_API_URL, default "/api/v1" — same origin. On Vercel the
 *   top-level rewrite in /vercel.json routes it to the `api` service; locally the
 *   rewrite in next.config.ts proxies it. Either way the refresh-token cookie
 *   stays first-party.
 * - Server: resolved by serverApiUrl() below. Never exposed to the browser.
 */
const API_PREFIX = '/api/v1';
const DEFAULT_BACKEND = `http://localhost:4000${API_PREFIX}`;

const trim = (url: string) => url.replace(/\/+$/, '');

/**
 * Where server-side code reaches the API, in order of precedence:
 * 1. API_INTERNAL_URL — explicit override (local dev, or a separately hosted API).
 * 2. API_SERVICE_URL — injected by the Vercel service binding (web → api). It is
 *    the api service's base URL; the service receives the full path, so the
 *    /api/v1 prefix is appended. Bindings resolve at runtime only, not in builds.
 * 3. During `next build` on Vercel, the current production deployment's public
 *    API, so prerendered pages get real content. (On the very first deploy it
 *    doesn't exist yet; pages fall back and refresh within a minute.)
 * 4. NEXT_PUBLIC_API_URL if absolute, else the local default.
 */
export function serverApiUrl(): string {
  const { API_INTERNAL_URL, API_SERVICE_URL, NEXT_PUBLIC_API_URL, NEXT_PHASE, VERCEL_PROJECT_PRODUCTION_URL } =
    process.env;
  if (API_INTERNAL_URL) return trim(API_INTERNAL_URL);
  if (API_SERVICE_URL && NEXT_PHASE !== 'phase-production-build') {
    return `${trim(API_SERVICE_URL)}${API_PREFIX}`;
  }
  if (NEXT_PHASE === 'phase-production-build' && VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${VERCEL_PROJECT_PRODUCTION_URL}${API_PREFIX}`;
  }
  if (NEXT_PUBLIC_API_URL && /^https?:\/\//.test(NEXT_PUBLIC_API_URL)) return trim(NEXT_PUBLIC_API_URL);
  return DEFAULT_BACKEND;
}

export function browserApiUrl(): string {
  return trim(process.env.NEXT_PUBLIC_API_URL || API_PREFIX);
}

/** Public site URL; on Vercel, defaults to the production domain. */
export const SITE_URL = trim(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000',
);
