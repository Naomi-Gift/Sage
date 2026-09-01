import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { parseWeb3Error } from '../lib/parseError';

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  txUrl?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (options: {
    type?: ToastType;
    title?: string;
    message: string | unknown;
    txUrl?: string;
    duration?: number;
  }) => void;
  error: (message: unknown, title?: string) => void;
  success: (message: string, title?: string, txUrl?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      txUrl,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string | unknown;
      txUrl?: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const cleanMessage =
        typeof message === 'string'
          ? message
          : parseWeb3Error(message);

      const defaultTitle =
        title ||
        (type === 'error'
          ? 'Transaction Failed'
          : type === 'success'
          ? 'Success'
          : type === 'warning'
          ? 'Notice'
          : 'Information');

      const newToast: ToastItem = {
        id,
        type,
        title: defaultTitle,
        message: cleanMessage,
        txUrl,
        duration,
      };

      setToasts((prev) => [...prev.slice(-2), newToast]); // keep max 3 on screen

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const error = useCallback(
    (message: unknown, title?: string) => {
      showToast({ type: 'error', message, title, duration: 5000 });
    },
    [showToast]
  );

  const success = useCallback(
    (message: string, title?: string, txUrl?: string) => {
      showToast({ type: 'success', message, title, txUrl, duration: 4500 });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'info', message, title, duration: 3500 });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      showToast({ type: 'warning', message, title, duration: 4500 });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, error, success, info, warning, dismissToast }}>
      {children}
      {/* Global Toast Container */}
      <div className="sage-toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`sage-toast sage-toast-${toast.type}`}>
            <div className="sage-toast-icon">
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'warning' && <AlertTriangle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
            </div>

            <div className="sage-toast-content">
              {toast.title && <strong className="sage-toast-title">{toast.title}</strong>}
              <p className="sage-toast-message">{toast.message}</p>
              {toast.txUrl && (
                <a
                  href={toast.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sage-toast-tx-link"
                >
                  <span>View on Celoscan</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            <button
              type="button"
              className="sage-toast-close"
              onClick={() => dismissToast(toast.id)}
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
