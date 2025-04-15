// src/components/notes/TagList.tsx
import React from 'react';
import { Tag } from '@/addons/notebook/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TagListProps {
  tags: Tag[];
  selectedTags: number[];
  onSelectTag: (tagId: number) => void;
  onCreateTag?: () => void;
}

export function TagList({
  tags,
  selectedTags,
  onSelectTag,
  onCreateTag
}: TagListProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="font-medium">Tags</h3>
        {onCreateTag && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateTag}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="px-4 space-y-1">
        {tags.map(tag => (
          <div
            key={tag.id}
            className={`
              flex items-center px-2 py-1 rounded-md cursor-pointer
              hover:bg-gray-100 transition-colors
              ${selectedTags.includes(tag.id) ? 'bg-gray-100' : ''}
            `}
            onClick={() => onSelectTag(tag.id)}
          >
            <div
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: tag.color }}
            />
            <span className="truncate">{tag.name}</span>
            <span className="ml-auto text-xs text-gray-400">
              {tag.notes_count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}