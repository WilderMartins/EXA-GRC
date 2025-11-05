import React, { useState, useEffect } from 'react';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useDb } from '../hooks/useDb';
import { useToast } from '../hooks/useToast';

export const ControlsPage = () => {
    const { api } = useDb();
    const addToast = useToast();
    const [controls, setControls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingControl, setEditingControl] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('controls', (data) => {
            setControls(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveControl = async (formData) => {
        try {
            if (editingControl) {
                await api.update('controls', editingControl.id, formData);
                addToast('Controle atualizado com sucesso!', 'success');
            } else {
                await api.create('controls', formData);
                addToast('Controle criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingControl(null);
        } catch (error) {
            console.error("Error saving control:", error);
            addToast('Falha ao salvar o controle.', 'error');
        }
    };

    const handleDeleteControl = async (id) => {
        try {
            await api.remove('controls', id);
            addToast('Controle excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Error deleting control:", error);
            addToast('Falha ao excluir o controle.', 'error');
        }
    };

    const ControlForm = ({ control, onSave, onCancel }) => {
        const [formData, setFormData] = useState(control || {
            name: '', description: '', family: '', framework: 'NIST CSF'
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome do Controle" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Descrição" required rows="4" className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="text" name="family" value={formData.family} onChange={handleChange} placeholder="Família (ex: Acesso, Criptografia)" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <select name="framework" value={formData.framework} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>NIST CSF</option><option>CIS Controls</option>
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
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Controles</h1>
                <button onClick={() => { setEditingControl(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Controle</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : controls.length === 0 ? (
                    <EmptyState
                        title="Nenhum Controle Cadastrado"
                        message="Comece adicionando um novo controle para poder vinculá-lo a riscos."
                        action={
                            <button onClick={() => { setEditingControl(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Controle</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Framework</th>
                                <th>Família</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {controls.map(control => (
                                <tr key={control.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{control.name}</td>
                                    <td>{control.framework}</td>
                                    <td>{control.family}</td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingControl(control); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(control.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingControl ? 'Editar Controle' : 'Novo Controle'}>
                <ControlForm control={editingControl} onSave={handleSaveControl} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteControl(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este controle? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
