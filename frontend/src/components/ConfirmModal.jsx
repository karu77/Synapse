import React from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const ConfirmModal = ({ open, title, description, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, danger }) => {
  const Icon = danger ? ExclamationTriangleIcon : CheckCircleIcon;

  return (
    <AnimatePresence>
      {open && (
        <Dialog
          static
          open={open}
          onClose={onCancel}
          as="div"
          className="fixed z-[80] inset-0 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              className="relative inline-block align-middle bg-skin-bg-accent rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-md w-full mx-auto p-6 z-10 border border-skin-border"
            >
              <div className="flex items-start gap-4">
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Icon className={`h-6 w-6 ${danger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} aria-hidden="true" />
                </div>
                <div className="mt-0 text-left flex-1">
                  <Dialog.Title as="h3" className="text-lg font-bold text-skin-text">
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <Dialog.Description className="text-sm text-skin-text-muted">
                      {description}
                    </Dialog.Description>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent px-4 py-2 bg-gray-200 dark:bg-gray-700 text-base font-medium text-skin-text hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800 transition-colors"
                  onClick={onCancel}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`w-full sm:w-auto inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors ${
                    danger 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-skin-accent hover:bg-skin-accent-hover focus:ring-skin-accent'
                  }`}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal; 