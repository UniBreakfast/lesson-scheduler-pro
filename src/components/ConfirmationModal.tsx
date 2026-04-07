import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-brick-100 text-brick-600'}`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
          
          <h3 className="text-xl font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-slate-500">{message}</p>
          
          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 ${
                variant === 'danger' 
                  ? 'bg-red-600 shadow-red-200 hover:bg-red-700' 
                  : 'bg-brick-600 shadow-brick-200 hover:bg-brick-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
