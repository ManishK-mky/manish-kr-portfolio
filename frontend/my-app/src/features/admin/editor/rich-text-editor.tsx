'use client';

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TableKit } from '@tiptap/extension-table';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { common, createLowlight } from 'lowlight';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Table,
  Underline,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MediaAsset, TiptapDoc } from '@/types/api';
import { MediaPicker } from '../media/media-picker';
import { FigureImage } from './figure-image';

const lowlight = createLowlight(common);

export const CODE_LANGUAGES = [
  'typescript', 'javascript', 'tsx', 'jsx', 'json', 'bash', 'shell', 'css', 'xml', 'python', 'go', 'rust',
  'java', 'sql', 'yaml', 'markdown', 'diff', 'plaintext',
].filter((l) => l === 'plaintext' || lowlight.registered(l));

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40',
        active && 'bg-accent text-foreground',
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />;

function Toolbar({ editor, onInsertImage }: { editor: Editor; onInsertImage: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      paragraph: e.isActive('paragraph'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
      table: e.isActive('table'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState('');
  const chain = () => editor.chain().focus();

  const applyLink = () => {
    const url = href.trim();
    if (!url) chain().extendMarkRange('link').unsetLink().run();
    else if (/^(https?:\/\/|mailto:|\/|#)/.test(url)) chain().extendMarkRange('link').setLink({ href: url }).run();
    else chain().extendMarkRange('link').setLink({ href: `https://${url}` }).run();
    setLinkOpen(false);
  };

  return (
    <div className="sticky top-14 z-10 border-b bg-card/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5" role="toolbar" aria-label="Formatting">
        <ToolButton label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
          <Undo2 className="size-4" />
        </ToolButton>
        <ToolButton label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
          <Redo2 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Paragraph" active={state.paragraph} onClick={() => chain().setParagraph().run()}>
          <Pilcrow className="size-4" />
        </ToolButton>
        <ToolButton label="Heading 1" active={state.h1} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="size-4" />
        </ToolButton>
        <ToolButton label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="size-4" />
        </ToolButton>
        <ToolButton label="Heading 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
          <Underline className="size-4" />
        </ToolButton>
        <ToolButton label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
          <Strikethrough className="size-4" />
        </ToolButton>
        <ToolButton label="Inline code" active={state.code} onClick={() => chain().toggleCode().run()}>
          <Code className="size-4" />
        </ToolButton>
        <ToolButton
          label={state.link ? 'Edit link' : 'Add link'}
          active={state.link || linkOpen}
          onClick={() => {
            setHref((editor.getAttributes('link').href as string | undefined) ?? '');
            setLinkOpen((o) => !o);
          }}
        >
          <Link2 className="size-4" />
        </ToolButton>
        {state.link && (
          <ToolButton label="Remove link" onClick={() => chain().extendMarkRange('link').unsetLink().run()}>
            <Unlink className="size-4" />
          </ToolButton>
        )}
        <Divider />
        <ToolButton label="Bullet list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <ToolButton label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
          <Quote className="size-4" />
        </ToolButton>
        <ToolButton label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
          <SquareCode className="size-4" />
        </ToolButton>
        <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
          <Minus className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Insert image" onClick={onInsertImage}>
          <ImagePlus className="size-4" />
        </ToolButton>
        <ToolButton
          label="Insert table"
          active={state.table}
          onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        >
          <Table className="size-4" />
        </ToolButton>
      </div>

      {linkOpen && (
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <Input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinkOpen(false);
            }}
            placeholder="https://example.com — leave empty to remove"
            aria-label="Link URL"
            className="h-8"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Apply
          </Button>
        </div>
      )}
      <ContextBar editor={editor} />
    </div>
  );
}

/** Extra controls for the selected image, table or code block. */
function ContextBar({ editor }: { editor: Editor }) {
  const ctx = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      image: e.isActive('image') ? (e.getAttributes('image') as { alt?: string; caption?: string }) : null,
      table: e.isActive('table'),
      codeLanguage: e.isActive('codeBlock') ? ((e.getAttributes('codeBlock').language as string | null) ?? '') : null,
    }),
  });
  const chain = () => editor.chain().focus();

  if (ctx.image) {
    return (
      <div className="flex flex-col gap-2 border-t px-3 py-2 sm:flex-row">
        <Input
          value={ctx.image.alt ?? ''}
          placeholder="Alt text (describe the image)"
          aria-label="Image alt text"
          className="h-8 text-xs"
          onChange={(e) => editor.chain().updateAttributes('image', { alt: e.target.value }).run()}
        />
        <Input
          value={ctx.image.caption ?? ''}
          placeholder="Caption (optional)"
          aria-label="Image caption"
          className="h-8 text-xs"
          onChange={(e) => editor.chain().updateAttributes('image', { caption: e.target.value }).run()}
        />
      </div>
    );
  }
  if (ctx.table) {
    const btn = (label: string, run: () => void) => (
      <Button key={label} type="button" size="xs" variant="ghost" onMouseDown={(e) => e.preventDefault()} onClick={run}>
        {label}
      </Button>
    );
    return (
      <div className="flex flex-wrap gap-1 border-t px-2 py-1.5">
        {btn('+ Row', () => chain().addRowAfter().run())}
        {btn('+ Column', () => chain().addColumnAfter().run())}
        {btn('− Row', () => chain().deleteRow().run())}
        {btn('− Column', () => chain().deleteColumn().run())}
        {btn('Toggle header', () => chain().toggleHeaderRow().run())}
        {btn('Merge/split', () => chain().mergeOrSplit().run())}
        {btn('Delete table', () => chain().deleteTable().run())}
      </div>
    );
  }
  if (ctx.codeLanguage !== null) {
    return (
      <div className="flex items-center gap-2 border-t px-3 py-1.5 text-xs">
        <label htmlFor="code-language" className="text-muted-foreground">
          Language
        </label>
        <select
          id="code-language"
          value={ctx.codeLanguage || 'plaintext'}
          onChange={(e) => chain().updateAttributes('codeBlock', { language: e.target.value === 'plaintext' ? null : e.target.value }).run()}
          className="h-7 rounded-md border bg-transparent px-2"
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return null;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
}: {
  value: TiptapDoc;
  onChange: (doc: TiptapDoc) => void;
  placeholder?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      FigureImage,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value as JSONContent,
    editorProps: {
      attributes: {
        class: 'prose-article tiptap mx-auto px-6 py-8 md:px-10',
        'aria-label': 'Article body',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getJSON() as TiptapDoc),
  });

  const words = useEditorState({
    editor,
    selector: ({ editor: e }) => (e ? (e.storage.characterCount?.words?.() as number | undefined) ?? 0 : 0),
  });

  // Keep the editor in sync if the document is replaced from outside.
  useEffect(() => {
    if (!editor) return;
    if (JSON.stringify(editor.getJSON()) !== JSON.stringify(value)) {
      editor.commands.setContent(value as JSONContent, { emitUpdate: false });
    }
  }, [editor, value]);

  const insertAsset = (asset: MediaAsset) => {
    editor
      ?.chain()
      .focus()
      .setImage({ src: asset.url, alt: asset.alt || '', title: undefined })
      .updateAttributes('image', { width: asset.width ?? null, height: asset.height ?? null, caption: '' })
      .run();
  };

  // overflow-clip, not overflow-hidden: `hidden` would make this box the sticky
  // toolbar's scroll container and offset the toolbar over the first lines.
  return (
    <div className="overflow-clip rounded-xl border bg-card">
      {editor ? (
        <>
          <Toolbar editor={editor} onInsertImage={() => setPickerOpen(true)} />
          <EditorContent editor={editor} />
          <div className="flex justify-end border-t px-4 py-2 text-xs text-muted-foreground">
            {words ?? 0} words · ~{Math.max(1, Math.round((words ?? 0) / 225))} min read
          </div>
        </>
      ) : (
        <div className="h-96 animate-pulse bg-muted/40" />
      )}
      <MediaPicker open={pickerOpen} onOpenChange={setPickerOpen} folder="blog" onSelect={insertAsset} />
    </div>
  );
}
