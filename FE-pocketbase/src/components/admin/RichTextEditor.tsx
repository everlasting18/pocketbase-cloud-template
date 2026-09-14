/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from "react";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  label: string;
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  description?: string;
  error?: string;
  minHeight?: "medium" | "large";
}

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}) => (
  <Button
    type="button"
    variant={active ? "secondary" : "ghost"}
    size="icon-sm"
    aria-label={label}
    aria-pressed={active}
    title={label}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </Button>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  label,
  value,
  onChange,
  onBlur,
  description,
  error,
  minHeight = "medium",
}) => {
  const editorId = useId();
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          autolink: true,
          defaultProtocol: "https",
          openOnClick: false,
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        id: editorId,
        class: cn(
          "rich-content max-w-none px-4 py-3 outline-none",
          minHeight === "large" ? "min-h-96" : "min-h-52",
        ),
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
    onBlur,
    shouldRerenderOnTransaction: true,
  });

  const setLink = () => {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", current ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  };

  const toggleSource = () => {
    if (!editor) return;
    if (sourceMode) {
      editor.commands.setContent(sourceValue, { emitUpdate: false });
      onChange(editor.isEmpty ? "" : editor.getHTML());
      setSourceMode(false);
      return;
    }
    setSourceValue(editor.isEmpty ? "" : editor.getHTML());
    setSourceMode(true);
  };

  const blockType = editor?.isActive("heading", { level: 2 })
    ? "heading-2"
    : editor?.isActive("heading", { level: 3 })
      ? "heading-3"
      : "paragraph";

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={editorId}>{label}</FieldLabel>
      <div className="overflow-hidden rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/35 p-1.5">
          <select
            aria-label="Text style"
            value={blockType}
            disabled={!editor || sourceMode}
            className="mr-1 h-7 rounded-md border-0 bg-transparent px-2 text-xs font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(event) => {
              if (!editor) return;
              if (event.target.value === "heading-2") {
                editor.chain().focus().setHeading({ level: 2 }).run();
              } else if (event.target.value === "heading-3") {
                editor.chain().focus().setHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
          >
            <option value="paragraph">Paragraph</option>
            <option value="heading-2">Heading 2</option>
            <option value="heading-3">Heading 3</option>
          </select>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Bold" active={editor?.isActive("bold")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold />
          </ToolButton>
          <ToolButton label="Italic" active={editor?.isActive("italic")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic />
          </ToolButton>
          <ToolButton label="Underline" active={editor?.isActive("underline")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <Underline />
          </ToolButton>
          <ToolButton label="Strikethrough" active={editor?.isActive("strike")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleStrike().run()}>
            <Strikethrough />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Bullet list" active={editor?.isActive("bulletList")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List />
          </ToolButton>
          <ToolButton label="Numbered list" active={editor?.isActive("orderedList")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered />
          </ToolButton>
          <ToolButton label="Blockquote" active={editor?.isActive("blockquote")} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>
            <Quote />
          </ToolButton>
          <ToolButton label="Link" active={editor?.isActive("link")} disabled={!editor || sourceMode} onClick={setLink}>
            <Link2 />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Align left" active={editor?.isActive({ textAlign: "left" })} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft />
          </ToolButton>
          <ToolButton label="Align center" active={editor?.isActive({ textAlign: "center" })} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter />
          </ToolButton>
          <ToolButton label="Align right" active={editor?.isActive({ textAlign: "right" })} disabled={!editor || sourceMode} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight />
          </ToolButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <ToolButton label="Undo" disabled={!editor?.can().undo() || sourceMode} onClick={() => editor?.chain().focus().undo().run()}>
            <Undo2 />
          </ToolButton>
          <ToolButton label="Redo" disabled={!editor?.can().redo() || sourceMode} onClick={() => editor?.chain().focus().redo().run()}>
            <Redo2 />
          </ToolButton>
          <div className="ml-auto">
            <ToolButton label={sourceMode ? "Visual editor" : "Edit HTML"} active={sourceMode} disabled={!editor} onClick={toggleSource}>
              <Code2 />
            </ToolButton>
          </div>
        </div>

        {sourceMode ? (
          <Textarea
            aria-label={`${label} HTML`}
            value={sourceValue}
            className={cn(
              "resize-y rounded-none border-0 font-mono text-xs shadow-none focus-visible:ring-0",
              minHeight === "large" ? "min-h-96" : "min-h-52",
            )}
            onBlur={onBlur}
            onChange={(event) => {
              setSourceValue(event.target.value);
              onChange(event.target.value);
            }}
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
};

export default RichTextEditor;
