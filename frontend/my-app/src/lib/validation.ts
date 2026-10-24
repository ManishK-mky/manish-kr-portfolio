import type { z } from 'zod';

/** Runs a zod schema and returns either the parsed data or a field → message map. */
export function fieldErrors<T extends z.ZodType>(schema: T, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) return { data: result.data as z.infer<T>, errors: {} as Record<string, string> };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    errors[key] ??= issue.message;
  }
  return { data: null, errors };
}
