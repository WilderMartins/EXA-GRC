import React from 'react';
import { Icon } from './Icon';

// --- UI COMPONENTS ---
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg p-6 border border-border-color" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <Icon name="X" size={24} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
