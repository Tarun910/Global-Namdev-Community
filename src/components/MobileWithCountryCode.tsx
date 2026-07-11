import { PHONE_DIAL_CODES } from '../lib/countries';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';

interface MobileWithCountryCodeProps {
  dialCode: string;
  onDialCodeChange: (code: string) => void;
  mobile: string;
  onMobileChange: (mobile: string) => void;
  label?: string;
  error?: string;
  maxLength?: number;
  disabled?: boolean;
  language?: Language;
}

export default function MobileWithCountryCode({
  dialCode,
  onDialCodeChange,
  mobile,
  onMobileChange,
  label,
  error,
  maxLength = 15,
  disabled = false,
  language = 'hi',
}: MobileWithCountryCodeProps) {
  const t = getTranslations(language);
  const displayLabel = label ?? t.formMobileNumber.replace(' *', '');
  const borderClass = error
    ? 'border-red-400 focus-within:ring-red-300'
    : 'border-slate-200 focus-within:ring-primary';

  return (
    <div className="w-full">
      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        {displayLabel} *
      </label>

      <div
        className={`flex w-full h-10 rounded-xl border bg-white overflow-hidden transition-shadow focus-within:ring-1 ${borderClass} ${disabled ? 'opacity-60 bg-slate-50' : ''}`}
      >
        <select
          value={dialCode}
          onChange={(e) => onDialCodeChange(e.target.value)}
          disabled={disabled}
          className="h-full w-[4.5rem] sm:w-[4.75rem] shrink-0 grow-0 border-0 border-r border-slate-200 bg-slate-50 px-1 text-[11px] sm:text-xs font-geist font-semibold text-slate-800 text-center cursor-pointer focus:outline-none disabled:cursor-not-allowed appearance-none"
          aria-label={t.mobileCountryCode}
          style={{ backgroundImage: 'none' }}
        >
          {PHONE_DIAL_CODES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>

        <input
          type="tel"
          inputMode="numeric"
          value={mobile}
          onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, '').slice(0, maxLength))}
          placeholder={t.mobilePlaceholder}
          disabled={disabled}
          className="h-full flex-1 min-w-0 basis-0 border-0 bg-transparent px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
        />
      </div>

      {error && <p className="text-[10px] text-red-500 font-medium mt-1.5">{error}</p>}
    </div>
  );
}
