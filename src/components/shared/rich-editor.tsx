"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Heading2, Heading3, Link2, Quote, Undo, Redo, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function RichEditor({ value, onChange, placeholder, minHeight = 220 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Link.configure({ openOnClick: false })],
    content: value,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose-content focus:outline-none px-4 py-3", style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  if (!editor) return <div className="input" style={{ minHeight }} />;
  const B = ({ on, active, children, title }: { on: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button type="button" title={title} onMouseDown={(e) => { e.preventDefault(); on(); }} className={cn("rounded-lg p-1.5 text-ink-soft hover:bg-muted hover:text-ink", active && "bg-brand-soft text-brand-strong")}>
      {children}
    </button>
  );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-elevated focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-muted/60 px-2 py-1.5">
        <B title="Título" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}><Heading2 className="h-4 w-4" /></B>
        <B title="Subtítulo" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}><Heading3 className="h-4 w-4" /></B>
        <span className="mx-1 h-5 w-px bg-line" />
        <B title="Negrita" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}><Bold className="h-4 w-4" /></B>
        <B title="Cursiva" on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}><Italic className="h-4 w-4" /></B>
        <B title="Tachado" on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}><UnderlineIcon className="h-4 w-4" /></B>
        <span className="mx-1 h-5 w-px bg-line" />
        <B title="Lista" on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}><List className="h-4 w-4" /></B>
        <B title="Lista numerada" on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}><ListOrdered className="h-4 w-4" /></B>
        <B title="Cita" on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}><Quote className="h-4 w-4" /></B>
        <B title="Separador" on={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></B>
        <B title="Enlace" on={() => { const url = window.prompt("URL del enlace"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={editor.isActive("link")}><Link2 className="h-4 w-4" /></B>
        <span className="mx-1 h-5 w-px bg-line" />
        <B title="Deshacer" on={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></B>
        <B title="Rehacer" on={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></B>
      </div>
      <EditorContent editor={editor} />
      {placeholder && editor.isEmpty && <p className="pointer-events-none -mt-[calc(100%-40px)] px-4 text-sm text-ink-muted" />}
    </div>
  );
}
