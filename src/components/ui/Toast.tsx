import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

// --- UI COMPONENTS ---
export const Toast = ({ message, type, onDismiss }) => {
  const icons = { success: 'CheckCircle', error: 'AlertCircle', info: 'Info' };
  const colors = { success: 'bg-secondary', error: 'bg-danger', info: 'bg-primary' };
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
  }

  return (
    <div className={`fixed bottom-5 right-5 flex items-center gap-4 p-4 rounded-lg shadow-lg text-white ${colors[type]} ${isExiting ? 'animate-fade-out-down' : 'animate-fade-in-up'}`}>
      <Icon name={icons[type]} size={24} />
      <span>{message}</span>
      <button onClick={handleDismiss} className="ml-4">
        <Icon name="X" size={20} />
      </button>
    </div>
  );
};
