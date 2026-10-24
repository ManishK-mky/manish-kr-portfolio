import { slugify, uniqueSlug } from './slug.js';

describe('slugify', () => {
  it.each([
    ['Hello World', 'hello-world'],
    ['  Next.js & NestJS  ', 'next-js-and-nestjs'],
    ['Crème brûlée', 'creme-brulee'],
    ['---', ''],
  ])('%s -> %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe('uniqueSlug', () => {
  it('appends a counter until the slug is free', async () => {
    const taken = new Set(['post', 'post-2']);
    await expect(uniqueSlug('Post', async (s) => taken.has(s))).resolves.toBe('post-3');
  });

  it('never returns a reserved route segment', async () => {
    await expect(uniqueSlug('Admin', async () => false)).resolves.toBe('admin-2');
  });

  it('falls back when the title has no usable characters', async () => {
    await expect(uniqueSlug('!!!', async () => false)).resolves.toBe('untitled');
  });
});
