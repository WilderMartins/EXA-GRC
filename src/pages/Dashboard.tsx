import React from 'react';

export const Dashboard = () => (
  <div>
    <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard de Gestão de Riscos</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       {/* Placeholder cards */}
      <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Riscos Abertos</h2>
        <p className="text-4xl font-bold text-primary mt-2">12</p>
      </div>
      <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Risco Residual Médio</h2>
        <p className="text-4xl font-bold text-risk-high mt-2">15.8</p>
      </div>
       <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Controles Efetivos</h2>
        <p className="text-4xl font-bold text-secondary mt-2">85%</p>
      </div>
       <div className="bg-surface p-6 rounded-lg border border-border-color">
        <h2 className="text-lg font-semibold text-text-secondary">Ameaças Ativas</h2>
        <p className="text-4xl font-bold text-risk-medium mt-2">4</p>
      </div>
    </div>
  </div>
);
