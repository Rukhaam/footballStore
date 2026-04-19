import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, ShieldAlert } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Container - Fixed to bottom right */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-2xl animate-slide-in min-w-[300px]
              ${toast.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-surface-low border-white/10 text-white backdrop-blur-md'
              }
            `}
          >
            {toast.type === 'error' ? (
              <ShieldAlert size={20} className="shrink-0" />
            ) : (
              <CheckCircle size={20} className="text-brand-primary shrink-0" />
            )}
            
            <span className="font-inter text-sm font-medium flex-grow">{toast.message}</span>
            
            <button 
              onClick={() => removeToast(toast.id)} 
              className="ml-4 text-white/40 hover:text-white transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};