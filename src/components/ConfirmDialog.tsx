import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmDialogAction {
  label: string;
  variant?: 'primary' | 'danger' | 'ghost';
  onClick: () => void;
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actions: ConfirmDialogAction[];
}

const actionClass = (variant: ConfirmDialogAction['variant'] = 'ghost') => {
  switch (variant) {
    case 'primary':
      return 'bg-primary text-white hover:opacity-90';
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600';
    default:
      return 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50';
  }
};

export default function ConfirmDialog({
  open,
  title,
  message,
  onClose,
  actions,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] cursor-pointer"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-6 space-y-4"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="space-y-1.5">
                <h2 id="confirm-dialog-title" className="font-sans text-sm font-bold text-slate-900">
                  {title}
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`px-4 py-2.5 rounded-xl font-geist text-xs font-bold transition-all active:scale-[0.99] cursor-pointer ${actionClass(action.variant)}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
