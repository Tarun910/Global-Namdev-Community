import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, LogOut } from 'lucide-react';

export type ToastVariant = 'login' | 'logout';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

const TOAST_DURATION_MS = 3200;

let toastId = 0;
let emitToast: ((message: string, variant: ToastVariant) => void) | null = null;

export function showToast(message: string, variant: ToastVariant = 'login'): void {
  emitToast?.(message, variant);
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    emitToast = pushToast;
    return () => {
      emitToast = null;
    };
  }, [pushToast]);

  return (
    <div
      aria-live="polite"
      className="fixed top-[4.25rem] left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 w-[min(100%,24rem)] px-4 pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 shadow-lg shadow-slate-200/60"
          >
            <span
              className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg ${
                toast.variant === 'login' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}
            >
              {toast.variant === 'login' ? (
                <CheckCircle2 className="w-4 h-4" aria-hidden />
              ) : (
                <LogOut className="w-4 h-4" aria-hidden />
              )}
            </span>
            <p className="text-xs font-semibold text-slate-800 leading-snug">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
