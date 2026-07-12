import { Phone, ShieldCheck } from 'lucide-react';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import {
  isValidOtpCode,
  normalizeOtpInput,
} from '../lib/otpConstants';
import BackButton from './BackButton';
import OtpDigitInput from './OtpDigitInput';

const DEMO_OTP = '1234';

interface OtpVerificationStepProps {
  mobile: string;
  dialCode?: string;
  otp: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onBack: () => void;
  onResend?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
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
  onSkip,
  skipLabel,
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
      <BackButton onClick={onBack} label={t.otpBack} />

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
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center">
            {t.otpFieldLabel}
          </label>
          <OtpDigitInput
            value={otp}
            onChange={(next) => onOtpChange(normalizeOtpInput(next))}
            error={Boolean(error)}
            disabled={isVerifying}
          />
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
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

        {onSkip && resendCooldown <= 0 && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-primary cursor-pointer"
          >
            {skipLabel ?? t.otpNotReceivedPasswordBtn}
          </button>
        )}
      </form>
    </div>
  );
}
