// src/components/notes/NoteEditor.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Pin, Archive, Trash2, Clock } from "lucide-react";
import { Tag } from "@/addons/notebook/types";
import dynamic from "next/dynamic";
import { NoteEditorProps } from "@/addons/notebook/types/";

const Editor = dynamic(
  () => import("@/components/ui/Editor").then((mod) => mod.Editor),
  { ssr: false }
);

export function NoteEditor({
  note,
  categories,
  onSave,
  onDelete,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [category, setCategory] = useState(note?.category);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(note?.tags || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setSelectedTags(note.tags);
    }
  }, [note]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        ...note,
        title,
        content,
        category,
        tags: selectedTags,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !onDelete ||
      !window.confirm("Are you sure you want to delete this note?")
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-lg font-medium w-96"
          />

          <select
            value={category}
            onChange={(e) => setCategory(Number(e.target.value))}
            className="border rounded p-2"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {note && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSave({ ...note, is_pinned: !note.is_pinned })}
              >
                <Pin
                  className={`h-4 w-4 ${note.is_pinned ? "text-blue-500" : ""}`}
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onSave({ ...note, is_archived: !note.is_archived })
                }
              >
                <Archive
                  className={`h-4 w-4 ${
                    note.is_archived ? "text-gray-500" : ""
                  }`}
                />
              </Button>

              {note.is_due_for_review && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onSave({
                      ...note,
                      last_reviewed_at: new Date().toISOString(),
                    })
                  }
                >
                  <Clock className="h-4 w-4 text-orange-500" />
                </Button>
              )}
            </>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>

          {note && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <Editor
          value={content}
          onChange={setContent}
          className="min-h-[500px] p-4"
        />
      </div>
    </div>
  );
}
