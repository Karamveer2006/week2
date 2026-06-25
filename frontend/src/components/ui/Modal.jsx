import React from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className={cn("relative w-full max-w-md rounded-lg bg-white shadow dark:bg-gray-800", className)}>
        {children}
      </div>
    </div>
  );
};

export const ModalHeader = ({ title, onClose, className }) => (
  <div className={cn("flex items-center justify-between rounded-t border-b p-4 dark:border-gray-600", className)}>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
      {title}
    </h3>
    <button
      onClick={onClose}
      type="button"
      className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
    >
      <X className="h-5 w-5" />
    </button>
  </div>
);

export const ModalBody = ({ children, className }) => (
  <div className={cn("p-6 space-y-4", className)}>
    {children}
  </div>
);

export const ModalFooter = ({ children, className }) => (
  <div className={cn("flex items-center justify-end rounded-b border-t p-4 dark:border-gray-600 space-x-2", className)}>
    {children}
  </div>
);
