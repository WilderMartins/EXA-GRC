import React, { useState, useEffect } from 'react';
import { useDb } from '../hooks/useDb';

export const Dashboard = () => {
    const { api } = useDb();
    const [risks, setRisks] = useState([]);
    const [threats, setThreats] = useState([]);
    const [controls, setControls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!api) return;

        const unsubRisks = api.getAll('risks', (data) => {
            setRisks(data);
            setIsLoading(false);
        });
        const unsubThreats = api.getAll('threats', setThreats);
        const unsubControls = api.getAll('controls', setControls);

        return () => {
            unsubRisks();
            unsubThreats();
            unsubControls();
        };
    }, [api]);

    // Card Calculations
    const openRisks = risks.filter(r => r.status === 'Open').length;
    const activeThreats = threats.length; // This is a simplification. A better metric would be threats linked to open risks.

    const averageResidualRisk = risks.length > 0
        ? (risks.reduce((acc, r) => acc + (r.likelihood * r.impact), 0) / risks.length).toFixed(1)
        : 0;

    const effectiveControls = controls.length > 0 && risks.length > 0
        ? (risks.filter(r => r.status === 'Closed').length / risks.length * 100).toFixed(0)
        : 0;

    // Framework Coverage Calculation
    const frameworks = {
        'NIST CSF': ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'],
        'CIS Controls': ['Implementation Group 1', 'Implementation Group 2', 'Implementation Group 3']
    };

    const calculateCoverage = (frameworkName) => {
        const frameworkControls = controls.filter(c => c.framework === frameworkName);
        const coveredFamilies = new Set(frameworkControls.map(c => c.family));
        const totalFamilies = frameworks[frameworkName].length;
        if (totalFamilies === 0) return 0;
        return ((coveredFamilies.size / totalFamilies) * 100).toFixed(0);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard de Gestão de Riscos</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-semibold text-text-secondary">Riscos Abertos</h2>
                    <p className="text-4xl font-bold text-primary mt-2">{isLoading ? '...' : openRisks}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-semibold text-text-secondary">Risco Residual Médio</h2>
                    <p className="text-4xl font-bold text-risk-high mt-2">{isLoading ? '...' : averageResidualRisk}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-semibold text-text-secondary">Controles Efetivos</h2>
                    <p className="text-4xl font-bold text-secondary mt-2">{isLoading ? '...' : `${effectiveControls}%`}</p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border-color">
                    <h2 className="text-lg font-semibold text-text-secondary">Ameaças Ativas</h2>
                    <p className="text-4xl font-bold text-risk-medium mt-2">{isLoading ? '...' : activeThreats}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-2xl font-bold text-text-primary mb-4">Cobertura de Frameworks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface p-6 rounded-lg border border-border-color">
                        <h3 className="text-lg font-semibold text-text-secondary mb-4">NIST CSF</h3>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                            <div className="bg-primary h-4 rounded-full" style={{ width: `${isLoading ? 0 : calculateCoverage('NIST CSF')}%` }}></div>
                        </div>
                        <p className="text-right text-sm mt-2 font-semibold">{isLoading ? '...' : `${calculateCoverage('NIST CSF')}%`}</p>
                    </div>
                    <div className="bg-surface p-6 rounded-lg border border-border-color">
                        <h3 className="text-lg font-semibold text-text-secondary mb-4">CIS Controls</h3>
                        <div className="w-full bg-gray-700 rounded-full h-4">
                            <div className="bg-secondary h-4 rounded-full" style={{ width: `${isLoading ? 0 : calculateCoverage('CIS Controls')}%` }}></div>
                        </div>
                        <p className="text-right text-sm mt-2 font-semibold">{isLoading ? '...' : `${calculateCoverage('CIS Controls')}%`}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
