import React, { useState, useEffect } from 'react';
import { Dashboard } from './pages/Dashboard';
import { RisksPage } from './pages/RisksPage';
import { AssetsPage } from './pages/AssetsPage';
import { ThreatsPage } from './pages/ThreatsPage';
import { ControlsPage } from './pages/ControlsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

export const Router = () => {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const routes = {
    '#/': <Dashboard />,
    '#/risks': <RisksPage />,
    '#/assets': <AssetsPage />,
    '#/threats': <ThreatsPage />,
    '#/controls': <ControlsPage />,
    '#/users': <UsersPage />,
    '#/settings': <SettingsPage />,
  };

  return routes[hash] || routes['#/'];
};
