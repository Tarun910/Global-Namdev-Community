import { ArrowLeft, Phone, ShieldCheck } from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import {
  isValidOtpCode,
  normalizeOtpInput,
  OTP_MAX_LENGTH,
} from '../lib/otpConstants';

const DEMO_OTP = '123456';

interface OtpVerificationStepProps {
  mobile: string;
  dialCode?: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onBack: () => void;
  onResend?: () => void;
  error?: string;
  isVerifying?: boolean;
  isSending?: boolean;
  resendCooldown?: number;
  demoMode?: boolean;
  title?: string;
  subtitle?: string;
  language?: Language;
}

export default function OtpVerificationStep({
  mobile,
  otp,
  onOtpChange,
  onVerify,
  onBack,
  onResend,
  error,
  isVerifying,
  isSending,
  resendCooldown = 0,
  demoMode = false,
  title,
  subtitle,
  dialCode = '+91',
  language = 'hi',
}: OtpVerificationStepProps) {
  const t = getTranslations(language);

  return (
    <div className="w-full max-w-md mx-auto min-w-0 space-y-6 py-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        {t.otpBack}
      </button>

      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-sans text-2xl font-bold text-slate-900">{title ?? t.otpDefaultTitle}</h2>
        <p className="text-xs text-slate-500 leading-relaxed break-words">
          {subtitle ?? (
            <>
              {t.otpSentPrefix}{' '}
              <span className="font-bold text-slate-700 inline-flex flex-wrap items-center gap-1 break-all">
                <Phone className="w-3 h-3 shrink-0" /> {dialCode} {mobile}
              </span>
            </>
          )}
        </p>
      </div>

      {demoMode && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-left space-y-1">
          <p className="text-[10px] font-geist font-bold uppercase tracking-wider text-amber-700">
            {t.otpDemoLabel}
          </p>
          <p className="text-xs text-amber-800">
            {t.otpDemoHint.replace('{{otp}}', DEMO_OTP)}
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onVerify();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t.otpFieldLabel}
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={OTP_MAX_LENGTH}
            value={otp}
            onChange={(e) => onOtpChange(normalizeOtpInput(e.target.value))}
            placeholder={t.otpPlaceholder}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={!isValidOtpCode(otp) || isVerifying}
          className="w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isVerifying ? t.otpVerifying : t.otpVerifyBtn}
        </button>

        {onResend && (
          <button
            type="button"
            onClick={onResend}
            disabled={isSending || resendCooldown > 0}
            className="w-full py-2 text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
          >
            {isSending
              ? t.otpSending
              : resendCooldown > 0
                ? t.otpResendWait.replace('{{seconds}}', String(resendCooldown))
                : t.otpResend}
          </button>
        )}
      </form>
    </div>
  );
}
