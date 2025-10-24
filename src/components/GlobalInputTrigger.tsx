import React from 'react';
import { Sparkles } from 'lucide-react';

interface GlobalInputTriggerProps {
  onClick: () => void;
}

export const GlobalInputTrigger: React.FC<GlobalInputTriggerProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 group animate-pulse-slow"
      aria-label="打开AI生成面板"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
      <Sparkles size={24} className="text-white relative z-10 animate-spin-slow" />
    </button>
  );
};
