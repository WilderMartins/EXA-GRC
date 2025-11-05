import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';

export const SettingsPage = () => {
    const addToast = useToast();
    const [apiKey, setApiKey] = useState(localStorage.getItem('geminiApiKey') || '');

    const handleSave = () => {
        localStorage.setItem('geminiApiKey', apiKey);
        addToast('Chave de API salva com sucesso!', 'success');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-text-primary mb-6">Configurações</h1>
            <div className="bg-surface rounded-lg border border-border-color p-6 max-w-2xl">
                <h2 className="text-xl font-bold mb-4">Configuração da IA (Google Gemini)</h2>
                <p className="text-text-secondary mb-4">
                    Insira sua chave de API do Google Gemini para habilitar funcionalidades de IA na plataforma.
                    Sua chave é salva localmente no seu navegador e não é enviada para nossos servidores.
                </p>
                <div className="flex flex-col gap-2">
                    <label htmlFor="apiKey" className="font-semibold">Chave de API do Google Gemini</label>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Cole sua chave de API aqui"
                        className="w-full p-2 bg-background border border-border-color rounded-md"
                    />
                </div>
                 <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                        Salvar Chave
                    </button>
                </div>
            </div>
        </div>
    );
};
