'use client';

import { useCallback } from 'react';
import { api } from '@/lib/api/client';
import { moveItem } from '../components/reorder';
import { useApiQuery, useMutation } from './use-api';

/**
 * List + create/update/delete/reorder for a simple REST resource.
 * `basePath` is e.g. "/companies"; the list comes from `listPath` (defaults to it).
 */
export function useCrud<T extends { id: string }>(
  basePath: string,
  { listPath = basePath, entity, reorderPath }: { listPath?: string; entity: string; reorderPath?: string },
) {
  const query = useApiQuery<T[]>(listPath);
  const { pending, run } = useMutation();
  const { setData, reload } = query;

  const save = useCallback(
    async (id: string | null, body: unknown) => {
      const result = await run(
        () => api<T>(id ? `${basePath}/${id}` : basePath, { method: id ? 'PATCH' : 'POST', body }),
        { success: id ? `${entity} updated` : `${entity} created` },
      );
      if (result) await reload();
      return result;
    },
    [basePath, entity, run, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      const ok = await run(() => api(`${basePath}/${id}`, { method: 'DELETE' }), { success: `${entity} deleted` });
      if (ok) setData((items) => items?.filter((i) => i.id !== id));
      return Boolean(ok);
    },
    [basePath, entity, run, setData],
  );

  /** Optimistically reorders, persists, and reloads if the server refuses. */
  const move = useCallback(
    async (items: T[], from: number, to: number) => {
      const next = moveItem(items, from, to);
      setData(next);
      const ok = await run(() =>
        api(reorderPath ?? `${basePath}/reorder`, { method: 'PATCH', body: { ids: next.map((i) => i.id) } }),
      );
      if (!ok) await reload();
    },
    [basePath, reorderPath, run, setData, reload],
  );

  return { ...query, pending, save, remove, move };
}
