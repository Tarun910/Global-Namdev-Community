import { useId } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatIsoToDob, parseDobToIso, todayIsoDate } from '../lib/dobFormat';

interface DobOrAgeFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
}

const baseInputClass =
  'w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1';

export default function DobOrAgeField({
  value,
  onChange,
  error,
  className = '',
  inputClassName = '',
}: DobOrAgeFieldProps) {
  const fieldId = useId();

  const borderClass = error
    ? 'border-red-400 focus:ring-red-300'
    : 'border-slate-200 focus:ring-primary';

  const isoValue = parseDobToIso(value) ?? '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative">
        <CalendarDays className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id={fieldId}
          type="date"
          value={isoValue}
          min="1900-01-01"
          max={todayIsoDate()}
          onChange={(e) => onChange(e.target.value ? formatIsoToDob(e.target.value) : '')}
          className={`${baseInputClass} ${borderClass} pl-9 dob-date-input ${inputClassName}`}
        />
      </div>
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
