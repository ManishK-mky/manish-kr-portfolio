import { toHtml } from 'hast-util-to-html';
import { common, createLowlight } from 'lowlight';
import sanitizeHtml from 'sanitize-html';
import { slugify } from '../../common/utils/slug.js';

/**
 * Renders a Tiptap (ProseMirror) JSON document to HTML on the server.
 *
 * The JSON is the source of truth; this renderer is a whitelist. Unknown node
 * types are dropped (their text children kept), every text and attribute value
 * is escaped, and URLs are restricted to safe schemes and the image CDN. The
 * output then passes through sanitize-html as a second, independent layer.
 */

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export interface RenderResult {
  html: string;
  toc: TocEntry[];
  text: string;
  wordCount: number;
  readingTime: number;
  imageUrls: string[];
}

export class InvalidContentError extends Error {}

const MAX_DEPTH = 40;
const MAX_NODES = 20_000;
const WORDS_PER_MINUTE = 225;
const IMAGE_HOST = 'https://res.cloudinary.com/';

const lowlight = createLowlight(common);

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const int = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' ? v : Number.parseInt(String(v), 10);
  return Number.isFinite(n) ? Math.min(Math.max(Math.trunc(n), min), max) : fallback;
};

export function safeHref(raw: unknown): string | null {
  const href = str(raw).trim();
  if (!href) return null;
  if (href.startsWith('#') || (href.startsWith('/') && !href.startsWith('//'))) {
    return href;
  }
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeImageSrc(raw: unknown): string | null {
  const src = str(raw).trim();
  if (!src.startsWith(IMAGE_HOST)) return null;
  try {
    return new URL(src).toString();
  } catch {
    return null;
  }
}

class Renderer {
  readonly toc: TocEntry[] = [];
  readonly images: string[] = [];
  private readonly textParts: string[] = [];
  private readonly usedIds = new Map<string, number>();
  private nodeCount = 0;

  render(doc: unknown): string {
    if (!doc || typeof doc !== 'object' || (doc as TiptapNode).type !== 'doc') {
      throw new InvalidContentError('Content must be a Tiptap document');
    }
    return this.children(doc as TiptapNode, 0);
  }

  get text() {
    return this.textParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private children(node: TiptapNode, depth: number): string {
    if (!Array.isArray(node.content)) return '';
    return node.content.map((child) => this.node(child, depth + 1)).join('');
  }

  private node(node: TiptapNode, depth: number): string {
    if (depth > MAX_DEPTH) throw new InvalidContentError('Content is nested too deeply');
    if (++this.nodeCount > MAX_NODES) throw new InvalidContentError('Content is too large');
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return '';

    const inner = () => this.children(node, depth);
    switch (node.type) {
      case 'text':
        return this.text_(node);
      case 'paragraph':
        return `<p>${inner()}</p>`;
      case 'heading':
        return this.heading(node, depth);
      case 'bulletList':
        return `<ul>${inner()}</ul>`;
      case 'orderedList': {
        const start = int(node.attrs?.start, 1, 100_000, 1);
        return `<ol${start !== 1 ? ` start="${start}"` : ''}>${inner()}</ol>`;
      }
      case 'listItem':
        return `<li>${inner()}</li>`;
      case 'blockquote':
        return `<blockquote>${inner()}</blockquote>`;
      case 'horizontalRule':
        return '<hr>';
      case 'hardBreak':
        return '<br>';
      case 'codeBlock':
        return this.codeBlock(node);
      case 'image':
        return this.image(node);
      case 'table':
        return `<div class="table-wrapper"><table><tbody>${inner()}</tbody></table></div>`;
      case 'tableRow':
        return `<tr>${inner()}</tr>`;
      case 'tableHeader':
      case 'tableCell':
        return this.cell(node, depth);
      default:
        // Unknown node: keep its readable content, drop the wrapper.
        return inner();
    }
  }

  private text_(node: TiptapNode): string {
    const raw = str(node.text);
    this.textParts.push(raw);
    let html = escapeHtml(raw);
    // Apply marks inside-out; link last so it wraps the formatted text.
    const marks = Array.isArray(node.marks) ? node.marks : [];
    const order = ['code', 'bold', 'italic', 'underline', 'strike', 'link'];
    for (const type of order) {
      const mark = marks.find((m) => m?.type === type);
      if (!mark) continue;
      switch (type) {
        case 'code':
          html = `<code>${html}</code>`;
          break;
        case 'bold':
          html = `<strong>${html}</strong>`;
          break;
        case 'italic':
          html = `<em>${html}</em>`;
          break;
        case 'underline':
          html = `<u>${html}</u>`;
          break;
        case 'strike':
          html = `<s>${html}</s>`;
          break;
        case 'link': {
          const href = safeHref(mark.attrs?.href);
          if (!href) break;
          const external = /^(https?:)?\/\//.test(href);
          html = `<a href="${escapeHtml(href)}"${
            external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''
          }>${html}</a>`;
          break;
        }
      }
    }
    return html;
  }

  private heading(node: TiptapNode, depth: number): string {
    const level = int(node.attrs?.level, 1, 6, 2);
    const plain = this.plainText(node).trim();
    const html = this.children(node, depth);
    const id = this.uniqueId(slugify(plain) || 'section');
    if (level <= 3 && plain) this.toc.push({ id, text: plain, level });
    return `<h${level} id="${id}">${html}</h${level}>`;
  }

  private codeBlock(node: TiptapNode): string {
    const code = (node.content ?? []).map((c) => str(c.text)).join('');
    this.textParts.push(code);
    const lang = str(node.attrs?.language).toLowerCase().replace(/[^a-z0-9+#-]/g, '');
    let body: string;
    let cls = 'hljs';
    if (lang && lowlight.registered(lang)) {
      body = toHtml(lowlight.highlight(lang, code));
      cls += ` language-${lang}`;
    } else {
      body = escapeHtml(code);
    }
    return `<pre data-language="${escapeHtml(lang || 'text')}"><code class="${cls}">${body}</code></pre>`;
  }

  private image(node: TiptapNode): string {
    const src = safeImageSrc(node.attrs?.src);
    if (!src) return '';
    this.images.push(src);
    const alt = escapeHtml(str(node.attrs?.alt));
    const caption = str(node.attrs?.caption).trim();
    const width = int(node.attrs?.width, 1, 10_000, 0);
    const height = int(node.attrs?.height, 1, 10_000, 0);
    const size = width && height ? ` width="${width}" height="${height}"` : '';
    const img = `<img src="${escapeHtml(src)}" alt="${alt}"${size} loading="lazy" decoding="async">`;
    if (caption) this.textParts.push(caption);
    return `<figure>${img}${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
  }

  private cell(node: TiptapNode, depth: number): string {
    const tag = node.type === 'tableHeader' ? 'th' : 'td';
    const colspan = int(node.attrs?.colspan, 1, 50, 1);
    const rowspan = int(node.attrs?.rowspan, 1, 50, 1);
    const attrs =
      (colspan > 1 ? ` colspan="${colspan}"` : '') + (rowspan > 1 ? ` rowspan="${rowspan}"` : '');
    return `<${tag}${attrs}>${this.children(node, depth)}</${tag}>`;
  }

  private plainText(node: TiptapNode): string {
    if (node.type === 'text') return str(node.text);
    return (node.content ?? []).map((c) => this.plainText(c)).join('');
  }

  private uniqueId(base: string): string {
    const n = this.usedIds.get(base) ?? 0;
    this.usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  }
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
    'blockquote', 'pre', 'code', 'span', 'strong', 'em', 'u', 's', 'a',
    'figure', 'figcaption', 'img', 'div', 'table', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
    h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
    ol: ['start'],
    pre: ['data-language'],
    code: ['class'],
    span: ['class'],
    div: ['class'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
  },
  allowedClasses: {
    code: ['hljs', /^language-[a-z0-9+#-]+$/],
    span: [/^hljs-[a-z-]+$/, /^[a-z]+_?$/],
    div: ['table-wrapper'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['https'] },
  allowProtocolRelative: false,
};

export function renderTiptap(doc: unknown): RenderResult {
  const renderer = new Renderer();
  const raw = renderer.render(doc);
  const html = sanitizeHtml(raw, SANITIZE_OPTIONS);
  const text = renderer.text;
  const wordCount = text ? text.split(/\s+/).length : 0;
  return {
    html,
    toc: renderer.toc,
    text,
    wordCount,
    readingTime: Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)),
    imageUrls: [...new Set(renderer.images)],
  };
}

export const EMPTY_DOC: TiptapNode = { type: 'doc', content: [{ type: 'paragraph' }] };
