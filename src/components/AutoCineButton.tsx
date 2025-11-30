import React from 'react';
import { Film } from 'lucide-react';

interface AutoCineButtonProps {
  onClick: () => void;
  isActive: boolean;
}

export const AutoCineButton: React.FC<AutoCineButtonProps> = ({ onClick, isActive }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Film size={16} />
      AutoCine
    </button>
  );
};
