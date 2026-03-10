import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import type { Toast as ToastType } from '../../hooks/useToast';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: number) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slideUp text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-2 hover:opacity-70 cursor-pointer">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
