export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive "contains" filter, safe against regex injection. */
export function containsFilter(search: string) {
  return { $regex: escapeRegex(search.trim()), $options: 'i' };
}
