import React from 'react';
import { Icon } from '../ui/Icon';
import { Tooltip } from '../ui/Tooltip';

export const Sidebar = ({ isSidebarOpen, setSidebarOpen }) => {
  const navItems = [
    { name: 'Dashboard', icon: 'Home', path: '#/' },
    { name: 'Riscos', icon: 'Shield', path: '#/risks' },
    { name: 'Ativos', icon: 'Database', path: '#/assets' },
    { name: 'Ameaças', icon: 'AlertTriangle', path: '#/threats' },
    { name: 'Controles', icon: 'ChevronsUpDown', path: '#/controls' },
    { name: 'Usuários', icon: 'Users', path: '#/users' },
    { name: 'Configurações', icon: 'Settings', path: '#/settings' },
  ];

  return (
    <aside className={`bg-surface border-r border-border-color flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center border-b border-border-color p-4 ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
        {isSidebarOpen && <h1 className="text-xl font-bold text-primary">EXA GRC</h1>}
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-700">
          <Icon name="SidebarIcon" size={24} />
        </button>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => (
          <a key={item.name} href={item.path}>
             <Tooltip text={item.name}>
              <div className={`flex items-center p-3 rounded-md text-text-secondary hover:bg-primary hover:text-white ${isSidebarOpen ? '' : 'justify-center'}`}>
                <Icon name={item.icon} size={24} />
                {isSidebarOpen && <span className="ml-4 font-medium">{item.name}</span>}
              </div>
            </Tooltip>
          </a>
        ))}
      </nav>
    </aside>
  );
};
