import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { OTP_LENGTH } from '../lib/otpConstants';

interface OtpDigitInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function OtpDigitInput({
  value,
  onChange,
  error = false,
  autoFocus = true,
  disabled = false,
}: OtpDigitInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const didAutoFocus = useRef(false);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (!autoFocus || didAutoFocus.current) return;
    didAutoFocus.current = true;
    const firstEmpty = digits.findIndex((d) => !d);
    inputsRef.current[firstEmpty >= 0 ? firstEmpty : OTP_LENGTH - 1]?.focus();
  }, [autoFocus, digits]);

  const commitDigits = (next: string[]) => {
    onChange(next.join('').replace(/\D/g, '').slice(0, OTP_LENGTH));
  };

  const focusAt = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(index, OTP_LENGTH - 1))]?.focus();
  };

  const fillFrom = (startIndex: number, raw: string) => {
    const chars = raw.replace(/\D/g, '').slice(0, OTP_LENGTH - startIndex).split('');
    if (chars.length === 0) return startIndex;

    const next = [...digits];
    chars.forEach((char, offset) => {
      next[startIndex + offset] = char;
    });
    commitDigits(next);
    return Math.min(startIndex + chars.length, OTP_LENGTH - 1);
  };

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');

    if (!raw) {
      const next = [...digits];
      next[index] = '';
      commitDigits(next);
      return;
    }

    if (raw.length > 1) {
      focusAt(fillFrom(index, raw));
      return;
    }

    const next = [...digits];
    next[index] = raw;
    commitDigits(next);
    if (index < OTP_LENGTH - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        commitDigits(next);
        return;
      }
      if (index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        commitDigits(next);
        focusAt(index - 1);
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    focusAt(fillFrom(index, pasted));
  };

  const boxClass = (index: number) => {
    const filled = Boolean(digits[index]);
    const base =
      'w-11 h-12 sm:w-12 sm:h-12 rounded-lg border-2 bg-white text-center text-lg font-bold text-slate-900 ' +
      'transition-all duration-150 outline-none caret-transparent ' +
      'disabled:opacity-50 disabled:cursor-not-allowed';

    if (error) {
      return `${base} border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100`;
    }

    if (filled) {
      return `${base} border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15`;
    }

    return `${base} border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/15`;
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digits[index] ?? ''}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          onFocus={(e) => e.target.select()}
          className={boxClass(index)}
        />
      ))}
    </div>
  );
}
