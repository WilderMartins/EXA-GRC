import React from 'react';
import { AlertTriangle } from 'lucide-react';

// --- UI COMPONENTS ---
export const EmptyState = ({ title, message, action }) => (
  <div className="text-center py-16 px-6 bg-surface rounded-lg border border-dashed border-border-color">
    <AlertTriangle className="mx-auto h-12 w-12 text-text-secondary" />
    <h3 className="mt-2 text-lg font-semibold text-text-primary">{title}</h3>
    <p className="mt-1 text-sm text-text-secondary">{message}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>
);
