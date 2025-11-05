import React from 'react';
import { Modal } from './Modal';

// --- UI COMPONENTS ---
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <p className="text-text-secondary mb-6">{message}</p>
    <div className="flex justify-end gap-4">
      <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors">Cancelar</button>
      <button onClick={onConfirm} className="px-4 py-2 rounded-md bg-danger hover:bg-red-700 text-white transition-colors">Confirmar</button>
    </div>
  </Modal>
);
