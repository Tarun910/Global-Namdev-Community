import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

/** Consistent back navigation — top-left, same style app-wide */
export default function BackButton({ onClick, label, className = '' }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
