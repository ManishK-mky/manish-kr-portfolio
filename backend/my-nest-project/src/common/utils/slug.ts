/** Route segments that would collide with static API or page routes. */
export const RESERVED_SLUGS = new Set([
  'admin',
  'featured',
  'categories',
  'tags',
  'reorder',
  'new',
  'sitemap',
  'facets',
]);

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/g, '');
}

/**
 * Returns `base` or `base-2`, `base-3`, ... — the first candidate for which
 * `exists` resolves false. Reserved words are always suffixed.
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || 'untitled';
  let candidate = RESERVED_SLUGS.has(root) ? `${root}-2` : root;
  let n = RESERVED_SLUGS.has(root) ? 2 : 1;
  while (await exists(candidate)) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}
