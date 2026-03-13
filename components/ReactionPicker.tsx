'use client';

import { useEffect, useRef } from 'react';

const REACTIONS = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '😂', label: 'Joy' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👎', label: 'Thumbs Down' },
  { emoji: '☕', label: 'Coffee' },
];

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
}

export default function ReactionPicker({
  onReact,
  onClose,
}: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className='absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-2 flex gap-1 z-50'
    >
      {REACTIONS.map(({ emoji, label }) => (
        <button
          key={emoji}
          onClick={() => {
            onReact(emoji);
            onClose();
          }}
          className='w-10 h-10 flex items-center justify-center text-2xl rounded-lg hover:bg-gray-700 transition-colors'
          title={label}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
