import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
}

export default function TagSelector({ selectedTags, onChange, availableTags }: TagSelectorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setIsAdding(false);
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const allAvailable = Array.from(new Set([...availableTags, ...selectedTags]));

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
        <TagIcon className="h-4 w-4" /> Tags
      </label>
      
      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-brick-100 px-3 py-1 text-xs font-bold text-brick-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="rounded-full p-0.5 hover:bg-brick-200"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        
        {isAdding ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(newTag);
                }
                if (e.key === 'Escape') setIsAdding(false);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs outline-none focus:border-brick-500"
              placeholder="Tag name..."
            />
            <button
              type="button"
              onClick={() => handleAddTag(newTag)}
              className="rounded-lg bg-brick-600 px-2 py-1 text-xs font-bold text-white"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 hover:border-brick-400 hover:text-brick-600"
          >
            <Plus className="h-3 w-3" /> New Tag
          </button>
        )}
      </div>

      {!isAdding && allAvailable.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {allAvailable
            .filter(tag => !selectedTags.includes(tag))
            .map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-200"
              >
                {tag}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
