
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-xs px-4 md:px-0 ml-auto">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getStyles = () => {
    switch (toast.type) {
      case 'success': return 'bg-white dark:bg-slate-800 border-green-500 text-slate-800 dark:text-white';
      case 'error': return 'bg-white dark:bg-slate-800 border-red-500 text-slate-800 dark:text-white';
      default: return 'bg-white dark:bg-slate-800 border-indigo-500 text-slate-800 dark:text-white';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error': return <AlertCircle size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-indigo-500" />;
    }
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-l-4 w-full animate-in slide-in-from-right-full fade-in duration-300 ${getStyles()}`}>
      {getIcon()}
      <p className="flex-1 text-sm font-bold">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X size={14} />
      </button>
    </div>
  );
};
