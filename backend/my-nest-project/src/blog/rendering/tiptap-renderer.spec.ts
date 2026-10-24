import { InvalidContentError, renderTiptap, safeHref } from './tiptap-renderer.js';

const doc = (...content: unknown[]) => ({ type: 'doc', content });
const text = (t: string, marks?: unknown[]) => ({ type: 'text', text: t, marks });
const p = (...content: unknown[]) => ({ type: 'paragraph', content });

describe('renderTiptap', () => {
  it('renders headings with unique ids and builds a table of contents', () => {
    const r = renderTiptap(
      doc(
        { type: 'heading', attrs: { level: 2 }, content: [text('Getting started')] },
        { type: 'heading', attrs: { level: 3 }, content: [text('Getting started')] },
        { type: 'heading', attrs: { level: 4 }, content: [text('Deep detail')] },
      ),
    );
    expect(r.html).toContain('<h2 id="getting-started">');
    expect(r.html).toContain('<h3 id="getting-started-2">');
    expect(r.toc).toEqual([
      { id: 'getting-started', text: 'Getting started', level: 2 },
      { id: 'getting-started-2', text: 'Getting started', level: 3 },
    ]);
  });

  it('escapes text so markup in content is never executed', () => {
    const r = renderTiptap(doc(p(text('<script>alert(1)</script> & "quotes"'))));
    expect(r.html).not.toContain('<script>');
    expect(r.html).toContain('&lt;script&gt;');
  });

  it('drops unsafe link schemes but keeps the link text', () => {
    const r = renderTiptap(
      doc(p(text('click', [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]))),
    );
    expect(r.html).toBe('<p>click</p>');
  });

  it('marks external links noopener and keeps relative links internal', () => {
    const r = renderTiptap(
      doc(
        p(text('ext', [{ type: 'link', attrs: { href: 'https://example.com' } }])),
        p(text('int', [{ type: 'link', attrs: { href: '/projects' } }])),
      ),
    );
    expect(r.html).toContain('rel="noopener noreferrer nofollow"');
    expect(r.html).toContain('<a href="/projects">int</a>');
  });

  it('only allows images from the Cloudinary CDN and renders captions', () => {
    const r = renderTiptap(
      doc(
        { type: 'image', attrs: { src: 'https://evil.example/x.png', alt: 'x' } },
        {
          type: 'image',
          attrs: {
            src: 'https://res.cloudinary.com/demo/image/upload/v1/a.jpg',
            alt: 'A chart',
            caption: 'Fig. 1',
          },
        },
      ),
    );
    expect(r.html).not.toContain('evil.example');
    expect(r.html).toContain('alt="A chart"');
    expect(r.html).toContain('<figcaption>Fig. 1</figcaption>');
    expect(r.imageUrls).toEqual(['https://res.cloudinary.com/demo/image/upload/v1/a.jpg']);
  });

  it('syntax-highlights known languages and escapes unknown ones', () => {
    const r = renderTiptap(
      doc(
        { type: 'codeBlock', attrs: { language: 'typescript' }, content: [text('const a = 1;')] },
        { type: 'codeBlock', attrs: { language: 'nope' }, content: [text('<b>')] },
      ),
    );
    expect(r.html).toContain('class="hljs language-typescript"');
    expect(r.html).toContain('<span class="hljs-keyword">const</span>');
    expect(r.html).toContain('&lt;b&gt;');
  });

  it('renders tables with spans', () => {
    const r = renderTiptap(
      doc({
        type: 'table',
        content: [
          { type: 'tableRow', content: [{ type: 'tableHeader', attrs: { colspan: 2 }, content: [p(text('H'))] }] },
        ],
      }),
    );
    expect(r.html).toContain('<th colspan="2"><p>H</p></th>');
  });

  it('computes word count and reading time', () => {
    const words = Array.from({ length: 450 }, () => 'word').join(' ');
    const r = renderTiptap(doc(p(text(words))));
    expect(r.wordCount).toBe(450);
    expect(r.readingTime).toBe(2);
  });

  it('rejects documents that are not Tiptap docs or are nested too deeply', () => {
    expect(() => renderTiptap({ type: 'paragraph' })).toThrow(InvalidContentError);
    let deep: Record<string, unknown> = { type: 'blockquote', content: [] };
    const root = deep;
    for (let i = 0; i < 60; i++) {
      const child = { type: 'blockquote', content: [] as unknown[] };
      (deep.content as unknown[]).push(child);
      deep = child;
    }
    expect(() => renderTiptap(doc(root))).toThrow(/nested too deeply/);
  });
});

describe('safeHref', () => {
  it.each([
    ['https://a.com', 'https://a.com/'],
    ['mailto:a@b.co', 'mailto:a@b.co'],
    ['#section', '#section'],
    ['/about', '/about'],
    ['//evil.com', null],
    ['data:text/html,x', null],
    ['  javascript:alert(1)', null],
  ])('%s -> %s', (input, expected) => {
    expect(safeHref(input)).toBe(expected);
  });
});
