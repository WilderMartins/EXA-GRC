import React, { useState, useEffect } from 'react';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useDb } from '../hooks/useDb';
import { useToast } from '../hooks/useToast';

export const ThreatsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [threats, setThreats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingThreat, setEditingThreat] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('threats', (data) => {
            setThreats(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveThreat = async (formData) => {
        try {
            if (editingThreat) {
                await api.update('threats', editingThreat.id, formData);
                addToast('Ameaça atualizada com sucesso!', 'success');
            } else {
                await api.create('threats', formData);
                addToast('Ameaça criada com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingThreat(null);
        } catch (error) {
            console.error("Error saving threat:", error);
            addToast('Falha ao salvar a ameaça.', 'error');
        }
    };

    const handleDeleteThreat = async (id) => {
        try {
            await api.remove('threats', id);
            addToast('Ameaça excluída com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting threat:", error);
            addToast('Falha ao excluir a ameaça.', 'error');
        }
    };

    const ThreatForm = ({ threat, onSave, onCancel }) => {
        const [formData, setFormData] = useState(threat || {
            name: '', description: '', type: 'Malicious'
        });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome da Ameaça" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required rows="4" className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="type" value={formData.type} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Malicious</option><option>Accidental</option><option>Environmental</option>
                </select>
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
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Ameaças</h1>
                <button onClick={() => { setEditingThreat(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Nova Ameaça</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : threats.length === 0 ? (
                    <EmptyState
                        title="Nenhuma Ameaça Cadastrada"
                        message="Comece adicionando uma nova ameaça para poder vinculá-la a riscos."
                        action={
                            <button onClick={() => { setEditingThreat(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Ameaça</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Descrição</th>
                                <th>Tipo</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {threats.map(threat => (
                                <tr key={threat.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{threat.name}</td>
                                    <td className="text-sm text-text-secondary max-w-md truncate">{threat.description}</td>
                                    <td><span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300">{threat.type}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingThreat(threat); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(threat.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingThreat ? 'Editar Ameaça' : 'Nova Ameaça'}>
                <ThreatForm threat={editingThreat} onSave={handleSaveThreat} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteThreat(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir esta ameaça? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
