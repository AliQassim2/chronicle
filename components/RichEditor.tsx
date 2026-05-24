"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Mark } from "@tiptap/core";
import TextAlign from "@tiptap/extension-text-align";
import LinkExtension from "@tiptap/extension-link";
import { useEffect } from "react";

const FontSizeMark = Mark.create({
  name: "fontSize",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el: any) => el.style.fontSize,
        renderHTML: (attrs: any) => {
          if (!attrs.size) return {};
          return { style: `font-size: ${attrs.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ style: "font-size", getAttrs: (val: any) => ({ size: val }) }];
  },
  renderHTML({ HTMLAttributes }: any) {
    return ["span", HTMLAttributes, 0];
  },
});

const ColorMark = Mark.create({
  name: "color",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el: any) => el.style.color,
        renderHTML: (attrs: any) => {
          if (!attrs.color) return {};
          return { style: `color: ${attrs.color}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ style: "color", getAttrs: (val: any) => ({ color: val }) }];
  },
  renderHTML({ HTMLAttributes }: any) {
    return ["span", HTMLAttributes, 0];
  },
});

const FontFamilyMark = Mark.create({
  name: "fontFamily",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (el: any) => el.style.fontFamily,
        renderHTML: (attrs: any) => {
          if (!attrs.family) return {};
          return { style: `font-family: ${attrs.family}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ style: "font-family", getAttrs: (val: any) => ({ family: val }) }];
  },
  renderHTML({ HTMLAttributes }: any) {
    return ["span", HTMLAttributes, 0];
  },
});

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const fonts = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Tahoma",
];

const sizes = ["12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px"];

const colors = [
  { label: "Default", value: "" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#9333ea" },
  { label: "Orange", value: "#ea580c" },
  { label: "Pink", value: "#db2777" },
  { label: "Teal", value: "#0d9488" },
  { label: "Gray", value: "#6b7280" },
];

export default function RichEditor({ value, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
      }),
      Underline,
      FontSizeMark,
      ColorMark,
      FontFamilyMark,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-zinc max-w-none min-h-[320px] px-5 py-4 text-sm focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, children, title }: any) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-zinc-800 text-white" : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {children}
    </button>
  );

  const Divider = () => <span className="mx-1 h-5 w-px bg-zinc-200" />;

  const sizeAttrs = editor.getAttributes("fontSize");
  const colorAttrs = editor.getAttributes("color");
  const familyAttrs = editor.getAttributes("fontFamily");

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          B
        </Btn>
        <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          I
        </Btn>
        <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          U
        </Btn>
        <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          S
        </Btn>

        <Divider />

        <select
          value={familyAttrs.family || ""}
          onChange={(e) => {
            const val = e.target.value;
            val
              ? editor.chain().focus().setMark("fontFamily", { family: val }).run()
              : editor.chain().focus().unsetMark("fontFamily").run();
          }}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Font</option>
          {fonts.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>

        <select
          value={sizeAttrs.size || ""}
          onChange={(e) => {
            const val = e.target.value;
            val
              ? editor.chain().focus().setMark("fontSize", { size: val }).run()
              : editor.chain().focus().unsetMark("fontSize").run();
          }}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          <option value="">Size</option>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={colorAttrs.color || ""}
          onChange={(e) => {
            const val = e.target.value;
            val
              ? editor.chain().focus().setMark("color", { color: val }).run()
              : editor.chain().focus().unsetMark("color").run();
          }}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
        >
          {colors.map((c) => (
            <option key={c.label} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <Divider />

        <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          H1
        </Btn>
        <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          H2
        </Btn>
        <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          H3
        </Btn>

        <Divider />

        <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          ≡
        </Btn>
        <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          1.
        </Btn>
        <Btn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          "
        </Btn>

        <Divider />

        <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align Left">
          ⬅
        </Btn>
        <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Center">
          ➡⬅
        </Btn>
        <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align Right">
          ➡
        </Btn>

        <Divider />

        <Btn
          active={false}
          onClick={() => {
            const url = prompt("Enter link URL:");
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          title="Insert Link"
        >
          🔗
        </Btn>
        <Btn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          —
        </Btn>

        <div className="ml-auto flex gap-1">
          <Btn active={false} onClick={() => editor.chain().focus().undo().run()} title="Undo">
            ↩
          </Btn>
          <Btn active={false} onClick={() => editor.chain().focus().redo().run()} title="Redo">
            ↪
          </Btn>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
