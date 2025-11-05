import React, { useState, useEffect } from 'react';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useDb } from '../hooks/useDb';
import { useToast } from '../hooks/useToast';

export const RisksPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [risks, setRisks] = useState([]);
    const [assets, setAssets] = useState([]);
    const [threats, setThreats] = useState([]);
    const [controls, setControls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRisk, setEditingRisk] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isSuggesting, setIsSuggesting] = useState(false);

    useEffect(() => {
        if (!api) return;
        const unsubRisks = api.getAll('risks', (data) => { setRisks(data); setIsLoading(false); });
        const unsubAssets = api.getAll('assets', setAssets);
        const unsubThreats = api.getAll('threats', setThreats);
        const unsubControls = api.getAll('controls', setControls);
        return () => { unsubRisks(); unsubAssets(); unsubThreats(); unsubControls(); };
    }, [api]);

    const getRiskScore = (likelihood, impact) => likelihood * impact;
    const getRiskLevel = (score) => {
        if (score <= 5) return { label: 'Baixo', color: 'risk-low' };
        if (score <= 12) return { label: 'Médio', color: 'risk-medium' };
        if (score <= 16) return { label: 'Alto', color: 'risk-high' };
        return { label: 'Crítico', color: 'risk-critical' };
    };

    const handleSaveRisk = async (formData) => {
        try {
            if (editingRisk) {
                await api.update('risks', editingRisk.id, formData);
                addToast('Risco atualizado com sucesso!', 'success');
            } else {
                await api.create('risks', { ...formData, createdAt: new Date().toISOString() });
                addToast('Risco criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingRisk(null);
        } catch (error) {
            console.error("Error saving risk:", error);
            addToast('Falha ao salvar o risco.', 'error');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.remove('risks', id);
            addToast('Risco excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting risk:", error);
            addToast('Falha ao excluir o risco.', 'error');
        }
    };

    const RiskForm = ({ risk, onSave, onCancel }) => {
        const [formData, setFormData] = useState(risk || {
            title: '', assetId: '', threatId: '', controlId: '', status: 'Open', likelihood: 3, impact: 3, owner: ''
        });

        const handleSuggestControl = async () => {
            const apiKey = localStorage.getItem('geminiApiKey');
            if (!apiKey) {
                addToast('A IA não está configurada. Adicione sua chave de API nas Configurações.', 'error');
                return;
            }

            const asset = assets.find(a => a.id === formData.assetId);
            const threat = threats.find(t => t.id === formData.threatId);

            if (!asset || !threat) {
                addToast('Selecione um Ativo e uma Ameaça para obter uma sugestão.', 'info');
                return;
            }

            setIsSuggesting(true);
            try {
                const { GoogleGenerativeAI } = await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://aistudiocdn.com/@google/genai@^1.27.0';
                    script.onload = () => resolve(window);
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = `Para um ativo do tipo "${asset.type}" com nome "${asset.name}", qual seria um bom controle de segurança para mitigar a ameaça de "${threat.name}"? Forneça um nome curto para o controle (máximo 5 palavras) e uma breve descrição (1-2 frases). Formate a resposta como: NOME: [nome do controle] DESCRIÇÃO: [descrição do controle]`;
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                const nameMatch = text.match(/NOME: (.*)/);
                const descMatch = text.match(/DESCRIÇÃO: (.*)/);

                if (nameMatch && descMatch) {
                    const newControlName = nameMatch[1].trim();
                    const newControlDesc = descMatch[1].trim();

                    // Check if a similar control already exists
                    const existingControl = controls.find(c => c.name.toLowerCase() === newControlName.toLowerCase());

                    if (existingControl) {
                         setFormData(prev => ({ ...prev, controlId: existingControl.id }));
                         addToast('Sugestão: Controle existente selecionado.', 'success');
                    } else {
                        // Create a new control
                        const newControl = await api.create('controls', {
                            name: newControlName,
                            description: newControlDesc,
                            family: 'Sugerido por IA',
                            framework: 'N/A'
                        });
                        setFormData(prev => ({ ...prev, controlId: newControl.id }));
                        addToast('Novo controle sugerido pela IA foi criado e selecionado!', 'success');
                    }
                } else {
                     addToast('A IA não retornou uma sugestão no formato esperado.', 'error');
                }

            } catch (error) {
                console.error("Error suggesting control:", error);
                addToast('Falha ao obter sugestão da IA.', 'error');
            } finally {
                setIsSuggesting(false);
            }
        };


        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: name === 'likelihood' || name === 'impact' ? parseInt(value) : value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Título do Risco" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="owner" value={formData.owner} onChange={handleChange} placeholder="Responsável (ex: email@empresa.com)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <div className="grid grid-cols-2 gap-4">
                    <select name="assetId" value={formData.assetId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione o Ativo</option>{assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                    <select name="threatId" value={formData.threatId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione a Ameaça</option>{threats.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                <div className="flex items-center gap-2">
                    <select name="controlId" value={formData.controlId} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md"><option value="">Selecione o Controle</option>{controls.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                    <button type="button" onClick={handleSuggestControl} disabled={isSuggesting} className="p-2 bg-secondary text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center">
                        {isSuggesting ? <Spinner /> : <Icon name="Sparkles" size={20} />}
                    </button>
                </div>
                 <select name="status" value={formData.status} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Open</option><option>In Progress</option><option>Closed</option><option>Accepted</option>
                </select>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-text-secondary">Probabilidade ({formData.likelihood})</label>
                        <input type="range" name="likelihood" min="1" max="5" value={formData.likelihood} onChange={handleChange} className="w-full" />
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary">Impacto ({formData.impact})</label>
                        <input type="range" name="impact" min="1" max="5" value={formData.impact} onChange={handleChange} className="w-full" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white">Salvar</button>
                </div>
            </form>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Riscos</h1>
                <button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Risco</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? <div className="p-16 flex justify-center"><Spinner /></div> :
                 risks.length === 0 ? <EmptyState title="Nenhum Risco Cadastrado" message="Comece adicionando um novo risco para monitorá-lo." action={<button onClick={() => { setEditingRisk(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors"><Icon name="PlusCircle" size={20} /><span>Adicionar Risco</span></button>} /> :
                <table className="w-full text-left">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="p-4">Título</th><th>Ativo</th><th>Status</th><th>Score</th><th>Nível</th><th>Responsável</th><th className="w-28">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {risks.map(risk => {
                            const score = getRiskScore(risk.likelihood, risk.impact);
                            const level = getRiskLevel(score);
                            const asset = assets.find(a => a.id === risk.assetId);
                            return (
                                <tr key={risk.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{risk.title}</td>
                                    <td>{asset?.name || 'N/A'}</td>
                                    <td><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">{risk.status}</span></td>
                                    <td><span className="font-bold">{score}</span></td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full text-white bg-${level.color}`}>{level.label}</span></td>
                                    <td>{risk.owner}</td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingRisk(risk); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(risk.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRisk ? 'Editar Risco' : 'Novo Risco'}>
                <RiskForm risk={editingRisk} onSave={handleSaveRisk} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDelete(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este risco? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
