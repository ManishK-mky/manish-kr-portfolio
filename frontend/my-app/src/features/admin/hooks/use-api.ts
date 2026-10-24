'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api, errorMessage, type RequestOptions } from '@/lib/api/client';

/**
 * Loads `path` (re-fetching when path/query change) with loading and error
 * state. `loading` is derived from whether the latest request has settled, so
 * no state is set synchronously inside the effect.
 */
export function useApiQuery<T>(path: string | null, query?: RequestOptions['query']) {
  const queryKey = JSON.stringify(query ?? {});
  const [nonce, setNonce] = useState(0);
  const requestKey = path ? `${path}|${queryKey}|${nonce}` : null;
  const [data, setData] = useState<T | undefined>(undefined);
  const [settled, setSettled] = useState<{ key: string | null; error: string | null }>({ key: null, error: null });

  useEffect(() => {
    if (!path || !requestKey) return;
    const controller = new AbortController();
    api<T>(path, { query: JSON.parse(queryKey), signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setSettled({ key: requestKey, error: null });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setSettled({ key: requestKey, error: errorMessage(err) });
      });
    return () => controller.abort();
  }, [path, queryKey, requestKey]);

  const reload = useCallback(async () => {
    setNonce((n) => n + 1);
  }, []);

  const loading = requestKey !== null && settled.key !== requestKey;
  const error = settled.key === requestKey ? settled.error : null;
  return { data, setData, error, loading, reload };
}

/**
 * Wraps a mutation with pending state and toast feedback.
 * Returns the result, or `undefined` if it failed (the error is toasted).
 */
export function useMutation() {
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, messages?: { success?: string; error?: string }) => {
      setPending(true);
      try {
        const result = await fn();
        if (messages?.success) toast.success(messages.success);
        return result;
      } catch (err) {
        toast.error(messages?.error ?? 'Request failed', { description: errorMessage(err) });
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [],
  );
  return { pending, run };
}

/** Warns before leaving the page while there are unsaved changes. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
