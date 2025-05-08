// src/components/ui/Editor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Toolbar as EditorToolbar } from "./editor/toolbar";
import { cn } from "@/core/utils/utils";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function Editor({
  value,
  onChange,
  className,
  placeholder = "Start writing...",
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-primary underline underline-offset-4 hover:text-primary/80",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg border border-border max-w-full",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[100px]', // Ensure a minimum height
      },
      handleDOMEvents: {
        keydown: (_, event) => {
          // Prevent default browser behavior for special characters
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      try {
        // Store both HTML and raw text content for better serialization options
        const html = editor.getHTML();
        // Also get text content for storage fallback
        const text = editor.getText();
        
        // Validate content before passing it back to parent
        if (text.trim() === '' && html.includes('<')) {
          // If there's no text but there are HTML tags, provide empty content
          onChange('');
        } else {
          onChange(html);
        }
      } catch (error) {
        console.error('Editor update error:', error);
        onChange(''); // Fallback to empty string
      }
    },
  });

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <EditorToolbar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}