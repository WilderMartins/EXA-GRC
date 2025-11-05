import React from 'react';

// --- UI COMPONENTS ---
export const Tooltip = ({ children, text }) => (
  <div className="relative group flex items-center">
    {children}
    <div className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-gray-800 border border-gray-700 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 origin-left">
      {text}
    </div>
  </div>
);
