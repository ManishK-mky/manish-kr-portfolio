import Image from '@tiptap/extension-image';

/**
 * Block image with alt text, an optional caption and intrinsic dimensions.
 * The JSON (not this HTML) is what gets saved; the API renders the published
 * markup itself, so this rendering only affects the editing surface.
 */
export const FigureImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        parseHTML: (el) => el.closest('figure')?.querySelector('figcaption')?.textContent ?? '',
        renderHTML: () => ({}),
      },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'figure img[src]' }, { tag: 'img[src]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const caption = node.attrs.caption as string;
    if (!caption) return ['img', HTMLAttributes];
    return ['figure', {}, ['img', HTMLAttributes], ['figcaption', {}, caption]];
  },
}).configure({ inline: false, allowBase64: false });
