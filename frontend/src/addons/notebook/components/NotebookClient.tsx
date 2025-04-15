// Original path: frontend/src/app/dashboard/apps/notebook/_components/NotebookClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Save, Trash2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { notebookAPI, Note } from "@/addons/notebook/api/notebookAPI";
import { NotebookClientProps } from "@/addons/notebook/types";

export default function NotebookClient({
  searchTerm,
  filter,
}: NotebookClientProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNotes();
  }, [searchTerm, filter]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      let data;
      if (searchTerm) {
        data = await notebookAPI.searchNotes(searchTerm);
      } else {
        data = await notebookAPI.getNotes(filter);
      }
      setNotes(data);
      setError(null);
    } catch (err) {
      setError("Failed to load notes. Please try again later.");
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNote.title || !newNote.content) return;

    try {
      const createdNote = await notebookAPI.createNote(newNote);
      setNotes([...notes, createdNote]);
      setNewNote({ title: "", content: "" });
    } catch (err) {
      setError("Failed to create note. Please try again.");
      console.error("Error creating note:", err);
    }
  };

  const handleUpdateNote = async (id: number, updatedData: Partial<Note>) => {
    try {
      const updatedNote = await notebookAPI.updateNote(id, updatedData);
      setNotes(notes.map((note) => (note.id === id ? updatedNote : note)));
      setEditingId(null);
    } catch (err) {
      setError("Failed to update note. Please try again.");
      console.error("Error updating note:", err);
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await notebookAPI.deleteNote(id);
      setNotes(notes.filter((note) => note.id !== id));
    } catch (err) {
      setError("Failed to delete note. Please try again.");
      console.error("Error deleting note:", err);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-6">Loading notes...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Note Form */}
      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Note Title"
              className="w-full p-2 border rounded"
              value={newNote.title}
              onChange={(e) =>
                setNewNote({ ...newNote, title: e.target.value })
              }
            />
            <textarea
              placeholder="Note Content"
              className="w-full p-2 border rounded min-h-[100px]"
              value={newNote.content}
              onChange={(e) =>
                setNewNote({ ...newNote, content: e.target.value })
              }
            />
            <Button
              onClick={handleCreateNote}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className="bg-white">
            <CardContent className="p-6">
              {editingId === note.id ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={note.title}
                    onChange={(e) =>
                      handleUpdateNote(note.id, { title: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full p-2 border rounded min-h-[100px]"
                    value={note.content}
                    onChange={(e) =>
                      handleUpdateNote(note.id, { content: e.target.value })
                    }
                  />
                  <Button onClick={() => setEditingId(null)} className="w-full">
                    <Save size={16} className="mr-2" />
                    Save
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{note.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingId(note.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 hover:bg-gray-100 rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600">{note.content}</p>
                  <div className="text-xs text-gray-400">
                    Last updated:{" "}
                    {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
