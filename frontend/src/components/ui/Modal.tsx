import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: keyof typeof sizeStyles;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${sizeStyles[size]} animate-scaleIn max-h-[85vh] sm:max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
            <h2 className="text-base sm:text-lg font-semibold text-text">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-text-secondary cursor-pointer">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
