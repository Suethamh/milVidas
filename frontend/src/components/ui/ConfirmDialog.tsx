import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar', message }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text mb-1">{title}</h3>
          <p className="text-sm text-text-secondary">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" className="flex-1" onClick={() => { onConfirm(); onClose(); }}>Confirmar</Button>
        </div>
      </div>
    </Modal>
  );
}
