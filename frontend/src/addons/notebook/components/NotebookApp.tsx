import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Languages,
  Volume2
} from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag, Note } from "@/addons/notebook/types";

const NotebookApp = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Note template



  // Types de notes

  // Niveaux de difficulté

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await notebookApi.getNotes();
        setNotes(response);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load notes",
          variant: "destructive"
        });
      }
    };

    fetchNotes();
  }, [toast]);

  const renderNote = (note: Note) => (
    <Card
      key={note.id}
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${note.is_pinned ? 'border-blue-200 bg-blue-50' : ''}
      `}
      onClick={() => setSelectedNote(note)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{note.title}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                {note.language.toUpperCase()}
              </span>
            </div>
            {note.translation && (
              <p className="text-sm text-gray-500 mt-1">{note.translation}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {note.pronunciation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Logique de prononciation
                }}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {note.example_sentences?.length > 0 && (
          <div className="mt-3 space-y-2">
            {note.example_sentences.map((sentence: string, idx: number) => (
              <p key={idx} className="text-sm">
                • {sentence}
              </p>
            ))}
          </div>
        )}

        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {note.tags.map((tag: Tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 rounded-full text-xs"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
          <span>{note.type}</span>
          <span>{note.difficulty}</span>
        </div>
      </CardContent>
    </Card>
  );


  // Rest of the component remains the same, but with proper type annotations
  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-4">
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>

          {/* Rest of the sidebar content */}
          {/* ... */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Languages className="w-4 h-4 mr-2" />
                Translation Mode
              </Button>
              <Button variant="ghost" size="sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Practice Mode
              </Button>
            </div>
          </div>
        </div>

        {/* Notes Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(renderNote)}
          </div>
        </ScrollArea>
      </div>

      {/* Create Note Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create New Language Note</DialogTitle>
          </DialogHeader>
          {/* Note form with language learning specific fields */}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotebookApp;