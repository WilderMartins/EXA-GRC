import React, { useState, useEffect } from 'react';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useDb } from '../hooks/useDb';
import { useToast } from '../hooks/useToast';

export const AssetsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [assets, setAssets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('assets', (data) => {
            setAssets(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveAsset = async (formData) => {
        try {
            if (editingAsset) {
                await api.update('assets', editingAsset.id, formData);
                addToast('Ativo atualizado com sucesso!', 'success');
            } else {
                await api.create('assets', formData);
                addToast('Ativo criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingAsset(null);
        } catch (error) {
            console.error("Error saving asset:", error);
            addToast('Falha ao salvar o ativo.', 'error');
        }
    };

    const handleDeleteAsset = async (id) => {
        try {
            await api.remove('assets', id);
            addToast('Ativo excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting asset:", error);
            addToast('Falha ao excluir o ativo.', 'error');
        }
    };

    const AssetForm = ({ asset, onSave, onCancel }) => {
        const [formData, setFormData] = useState(asset || {
            name: '', type: '', owner: '', criticality: 'Medium'
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Ativo" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="type" value={formData.type} onChange={handleChange} placeholder="Tipo (ex: Servidor, Banco de Dados)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="owner" value={formData.owner} onChange={handleChange} placeholder="Responsável (ex: TI, Negócios)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="criticality" value={formData.criticality} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
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
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Ativos</h1>
                <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Ativo</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : assets.length === 0 ? (
                    <EmptyState
                        title="Nenhum Ativo Cadastrado"
                        message="Comece adicionando um novo ativo para poder vinculá-lo a riscos."
                        action={
                            <button onClick={() => { setEditingAsset(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Ativo</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Tipo</th>
                                <th>Responsável</th>
                                <th>Criticidade</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assets.map(asset => (
                                <tr key={asset.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{asset.name}</td>
                                    <td>{asset.type}</td>
                                    <td>{asset.owner}</td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full text-white bg-risk-${asset.criticality?.toLowerCase()}`}>{asset.criticality}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingAsset(asset); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(asset.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAsset ? 'Editar Ativo' : 'Novo Ativo'}>
                <AssetForm asset={editingAsset} onSave={handleSaveAsset} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteAsset(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
