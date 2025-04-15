// src/components/notes/CategoryTree.tsx
import React from 'react';
import { Category } from '@/addons/notebook/types';
import { ChevronRight, ChevronDown, Folder } from 'lucide-react';
import { CategoryTreeProps } from '@/addons/notebook/types';


export function CategoryTree({ 
  categories,
  selectedCategory,
  onSelect
}: CategoryTreeProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<number[]>([]);

  const toggleExpanded = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategory = (category: Category, level = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasSubcategories = category.subcategories.length > 0;

    return (
      <div key={category.id}>
        <div
          className={`
            flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100
            ${selectedCategory === category.id ? 'bg-blue-50' : ''}
          `}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => onSelect(category.id)}
        >
          {hasSubcategories && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="mr-1 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          <Folder className="h-4 w-4 mr-2 text-gray-500" />
          <span className="truncate">{category.name}</span>
          <span className="ml-auto text-xs text-gray-400">
            {category.notes_count}
          </span>
        </div>
        
        {hasSubcategories && isExpanded && (
          <div>
            {category.subcategories.map(subcategory =>
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {categories.map(category => renderCategory(category))}
    </div>
  );
}