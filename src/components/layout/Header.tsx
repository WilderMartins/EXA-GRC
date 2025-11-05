import React from 'react';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-surface border-b border-border-color h-16 flex items-center justify-between px-6">
      <div>{/* Can add breadcrumbs or page title here */}</div>
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-700">
          <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} />
        </button>
        <div className="text-right">
          <div className="font-semibold text-text-primary">{user?.name}</div>
          <div className="text-sm text-text-secondary">{user?.role}</div>
        </div>
        <button onClick={logout} className="p-2 rounded-full text-text-secondary hover:text-danger hover:bg-gray-700">
          <Tooltip text="Sair">
             <Icon name="LogOut" size={20} />
          </Tooltip>
        </button>
      </div>
    </header>
  );
};
