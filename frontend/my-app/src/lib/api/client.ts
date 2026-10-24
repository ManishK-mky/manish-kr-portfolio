'use client';

import type { AdminUser, ApiErrorBody, ApiSuccess } from '@/types/api';
import { browserApiUrl } from './config';

/**
 * Browser API client for the admin dashboard.
 *
 * The access token lives only in memory (never localStorage). The refresh
 * token is an HttpOnly cookie the browser sends to /auth/refresh. Refreshes
 * are serialized across tabs with the Web Locks API so two tabs never present
 * the same refresh token (which the API treats as token theft).
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Human-readable list of validation messages, if any. */
  get detailMessages(): string[] {
    return Array.isArray(this.details)
      ? this.details.filter((d): d is string => typeof d === 'string')
      : [];
  }
}

const CSRF_HEADERS = { 'x-requested-with': 'portfolio-admin' };

let accessToken: string | null = null;
let refreshing: Promise<AuthSession | null> | null = null;
const listeners = new Set<(user: AdminUser | null) => void>();

export interface AuthSession {
  accessToken: string;
  user: AdminUser;
}

export function onAuthChange(fn: (user: AdminUser | null) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setSession(session: AuthSession | null) {
  accessToken = session?.accessToken ?? null;
  listeners.forEach((fn) => fn(session?.user ?? null));
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const body = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiErrorBody | null;
  if (!res.ok || !body || body.success === false) {
    const err = body && body.success === false ? body.error : undefined;
    throw new ApiError(
      res.status,
      err?.message ?? `Request failed (${res.status})`,
      err?.details,
      err?.code,
    );
  }
  return body.data;
}

async function doRefresh(): Promise<AuthSession | null> {
  const run = async () => {
    const res = await fetch(`${browserApiUrl()}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: CSRF_HEADERS,
    });
    if (!res.ok) return null;
    return parse<AuthSession>(res);
  };
  try {
    const session =
      typeof navigator !== 'undefined' && 'locks' in navigator
        ? await navigator.locks.request('portfolio-auth-refresh', run)
        : await run();
    setSession(session);
    return session;
  } catch {
    setSession(null);
    return null;
  }
}

/** Single-flight refresh within this tab. */
export function refreshSession(): Promise<AuthSession | null> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${browserApiUrl()}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const session = await parse<AuthSession>(res);
  setSession(session);
  return session;
}

export async function logout() {
  try {
    await fetch(`${browserApiUrl()}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: CSRF_HEADERS,
    });
  } finally {
    setSession(null);
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

/** Authenticated request; transparently refreshes an expired access token once. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = new URL(`${browserApiUrl()}${path}`, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }

  const send = () =>
    fetch(url, {
      method: opts.method ?? 'GET',
      credentials: 'include',
      signal: opts.signal,
      headers: {
        ...(opts.body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

  if (!accessToken) await refreshSession();
  let res = await send();
  if (res.status === 401 && (await refreshSession())) {
    res = await send();
  }
  return parse<T>(res);
}

/** Public (unauthenticated) request from the browser, e.g. the contact form. */
export async function publicApi<T>(path: string, opts: Omit<RequestOptions, 'query'> = {}) {
  const res = await fetch(`${browserApiUrl()}${path}`, {
    method: opts.method ?? 'GET',
    headers: opts.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  return parse<T>(res);
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.detailMessages;
    return details.length ? `${err.message}: ${details.slice(0, 3).join('; ')}` : err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
