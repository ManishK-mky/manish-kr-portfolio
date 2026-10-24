const monthYear = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatMonthYear(date?: string | null) {
  return date ? monthYear.format(new Date(date)) : '';
}

export function formatDate(date?: string | null) {
  return date ? fullDate.format(new Date(date)) : '';
}

export function formatRange(start?: string | null, end?: string | null, current = false) {
  const from = formatMonthYear(start);
  const to = current ? 'Present' : formatMonthYear(end);
  if (!from && !to) return '';
  if (!to) return from;
  if (!from) return to;
  return `${from} — ${to}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function toDateInput(date?: string | null) {
  return date ? new Date(date).toISOString().slice(0, 10) : '';
}

export function toDateTimeInput(date?: string | null) {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function slugify(input: string) {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export function paragraphs(text?: string) {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
