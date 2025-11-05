import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthProvider';
import { DbProvider } from './contexts/DbProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { useAuth } from './hooks/useAuth';
import { useDb } from './hooks/useDb';
import { Layout } from './components/layout/Layout';
import { Router } from './Router';
import { Login } from './components/auth/Login';
import { SetupWizard } from './components/auth/SetupWizard';
import { Spinner } from './components/ui/Spinner';
import '../index.css';

const AppContent = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(localStorage.getItem('isSetupComplete') === 'true');
  const { isAuthenticated, isLoading } = useAuth();
  const { isDbReady } = useDb();

  if (!isSetupComplete) {
      return <SetupWizard onSetupComplete={() => { setIsSetupComplete(true); window.location.reload(); }} />;
  }

  if (!isDbReady || isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-text-primary">
            <Spinner />
            <p className="mt-4">Carregando...</p>
        </div>
    );
  }

  return isAuthenticated ? <Layout><Router /></Layout> : <Login />;
};

const App = () => (
  <ToastProvider>
    <DbProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </DbProvider>
  </ToastProvider>
);

export default App;
