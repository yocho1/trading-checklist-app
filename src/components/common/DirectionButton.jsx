import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const DirectionButton = ({ direction, currentDirection, onChange }) => {
  const Icon = direction === 'LONG' ? ArrowUp : ArrowDown;
  
  return (
    <button
      onClick={() => onChange(direction)}
      className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg border transition-colors ${
        currentDirection === direction 
          ? (direction === 'LONG' ? 'bg-emerald-600 border-emerald-600' : 'bg-red-600 border-red-600') + ' text-white'
          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
      }`}
    >
      <Icon size={16} />
      <span>{direction}</span>
    </button>
  );
};