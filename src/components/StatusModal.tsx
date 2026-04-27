import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function StatusModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: StatusModalProps) {
  if (!isOpen) return null;

  const config = {
    success: { icon: <CheckCircle2 className="w-12 h-12 text-green-500" />, color: 'bg-green-500' },
    error: { icon: <XCircle className="w-12 h-12 text-red-500" />, color: 'bg-red-500' },
    confirm: { icon: <AlertCircle className="w-12 h-12 text-amber-500" />, color: 'bg-amber-500' },
    info: { icon: <Info className="w-12 h-12 text-indigo-500" />, color: 'bg-indigo-500' },
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden text-center p-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-slate-50 rounded-full">
            {config[type].icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          {type === 'confirm' ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm?.(); onClose(); }}
                className={`flex-1 py-4 ${config[type].color} text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className={`w-full py-4 ${config[type].color} text-white rounded-2xl font-bold shadow-lg transition-all active:scale-95`}
            >
              OK
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
