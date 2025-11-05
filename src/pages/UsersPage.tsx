import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useDb } from '../hooks/useDb';
import { useToast } from '../hooks/useToast';

export const UsersPage = () => {
    const { api, functions } = useDb();
    const addToast = useToast();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.getAll('users', (data) => {
            setUsers(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [api]);

    const handleSaveUser = async (formData) => {
        try {
            if (editingUser) {
                // NOTE: A edição do usuário (ex: mudança de função) exigiria outra Cloud Function.
                // Por simplicidade, isso não foi implementado.
                addToast('A edição de usuários ainda não foi implementada.', 'info');
            } else {
                const createUser = httpsCallable(functions, 'createUser');
                await createUser(formData);
                addToast('Usuário criado com sucesso!', 'success');
            }
            setIsModalOpen(false);
            setEditingUser(null);
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            addToast(`Falha ao salvar usuário: ${error.message}`, 'error');
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const deleteUser = httpsCallable(functions, 'deleteUser');
            await deleteUser({ uid: id });
            addToast('Usuário excluído com sucesso!', 'success');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error("Erro ao excluir usuário:", error);
            addToast(`Falha ao excluir usuário: ${error.message}`, 'error');
        }
    };

    const UserForm = ({ user, onSave, onCancel }) => {
        const [formData, setFormData] = useState(user || {
            name: '', email: '', role: 'Analyst', password: ''
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
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nome Completo" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-2 bg-background border border-border-color rounded-md" />
                {!user && <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Senha" required className="w-full p-2 bg-background border border-border-color rounded-md" />}
                <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2 bg-background border border-border-color rounded-md">
                    <option>Analyst</option><option>Admin</option>
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
                <h1 className="text-3xl font-bold text-text-primary">Gestão de Usuários</h1>
                <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                    <Icon name="PlusCircle" size={20} />
                    <span>Novo Usuário</span>
                </button>
            </div>

            <div className="bg-surface rounded-lg border border-border-color overflow-hidden">
                {isLoading ? (
                    <div className="p-16 flex justify-center"><Spinner /></div>
                ) : users.length === 0 ? (
                    <EmptyState
                        title="Nenhum Usuário Encontrado"
                        message="Comece adicionando um novo usuário."
                        action={
                            <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-md bg-primary hover:bg-blue-700 text-white transition-colors">
                                <Icon name="PlusCircle" size={20} />
                                <span>Adicionar Usuário</span>
                            </button>
                        }
                    />
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4">Nome</th>
                                <th>Email</th>
                                <th>Função</th>
                                <th className="w-28">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} className="border-b border-border-color hover:bg-gray-800">
                                    <td className="p-4 font-medium">{user.name}</td>
                                    <td>{user.email}</td>
                                    <td><span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'Admin' ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300'}`}>{user.role}</span></td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-text-secondary hover:text-primary"><Icon name="Edit" size={18} /></button>
                                        <button onClick={() => setConfirmDeleteId(user.id)} className="p-2 text-text-secondary hover:text-danger"><Icon name="Trash2" size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
                <UserForm user={editingUser} onSave={handleSaveUser} onCancel={() => setIsModalOpen(false)} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => handleDeleteUser(confirmDeleteId)}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita e é irreversível."
            />
        </div>
    );
};
