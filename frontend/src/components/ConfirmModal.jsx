import React from 'react';
import { Dialog } from '@headlessui/react';

const ConfirmModal = ({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger }) => {
  return (
    <Dialog open={open} onClose={onCancel} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-auto p-6 z-10">
          <Dialog.Title className={`text-lg font-bold mb-2 ${danger ? 'text-red-600 dark:text-red-400' : 'text-skin-accent'}`}>{title}</Dialog.Title>
          <Dialog.Description className="text-skin-text-muted mb-6">{description}</Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-skin-accent text-white hover:opacity-90'}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmModal; 