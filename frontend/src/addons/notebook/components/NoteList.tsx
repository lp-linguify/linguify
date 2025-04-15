// src/components/notes/NoteList.tsx
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Plus, 
  Bookmark, Archive, Clock 
} from 'lucide-react';
import { NoteListProps } from '@/addons/notebook/types/';

export function NoteList({ notes, onNoteSelect, onCreateNote }: NoteListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived' | 'review'>('all');

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (filter) {
      case 'pinned': return matchesSearch && note.is_pinned;
      case 'archived': return matchesSearch && note.is_archived;
      case 'review': return matchesSearch && note.is_due_for_review;
      default: return matchesSearch && !note.is_archived;
    }
  });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search and Filters */}
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pinned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pinned')}
          >
            <Bookmark className="h-4 w-4 mr-2" />
            Pinned
          </Button>
          <Button
            variant={filter === 'review' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('review')}
          >
            <Clock className="h-4 w-4 mr-2" />
            Review
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('archived')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archived
          </Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Button
          className="w-full"
          onClick={onCreateNote}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>

        {filteredNotes.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No notes found
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card
              key={note.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md 
                ${note.is_pinned ? 'border-blue-200 bg-blue-50' : ''}
                ${note.is_archived ? 'opacity-70' : ''}`}
              onClick={() => onNoteSelect(note)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium line-clamp-1">{note.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {note.content}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {note.is_pinned && (
                    <Bookmark className="h-4 w-4 text-blue-500" />
                  )}
                  {note.is_due_for_review && (
                    <Clock className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>
              
              {/* Tags */}
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {note.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 rounded-full text-xs"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex justify-between items-center mt-4 text-xs text-gray-400">
                <span>{note.category_name}</span>
                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
