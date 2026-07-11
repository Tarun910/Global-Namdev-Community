import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { Registration } from '../types';
import {
  normalizeMobile,
  setSession,
  findRegistrationByMobile,
  isValidLocalMobile,
  AuthSession,
} from '../lib/demoAuth';
import { resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';
import { useOtpMode } from '../hooks/useOtpMode';
import OtpVerificationStep from './OtpVerificationStep';
import Msg91CaptchaMount from './Msg91CaptchaMount';
import MobileWithCountryCode from './MobileWithCountryCode';
import { Language } from '../lib/languages';
import { getTranslations } from '../lib/translations';
import { pageEnter, tapScale } from '../lib/motionPresets';

interface LoginTabProps {
  registrations: Registration[];
  onLoginSuccess: (session: AuthSession) => void;
  onNavigateRegister: () => void;
  language: Language;
}

type LoginStep = 'mobile' | 'otp';

export default function LoginTab({
  registrations,
  onLoginSuccess,
  onNavigateRegister,
  language,
}: LoginTabProps) {
  const t = getTranslations(language);
  const { widgetMode } = useOtpMode();
  const [step, setStep] = useState<LoginStep>('mobile');
  const [dialCode, setDialCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const requestOtp = async () => {
    setError('');
    setIsSendingOtp(true);
    const result = await sendPhoneOtp(dialCode, mobile);
    setIsSendingOtp(false);

    if (!result.success) {
      setError(result.message);
      return false;
    }

    setOtpDemoMode(result.demo ?? false);
    if (result.reqId) setOtpReqId(result.reqId);
    setResendCooldown(30);
    setOtp('');
    return true;
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidLocalMobile(mobile)) {
      setError(t.loginErrorInvalidMobile);
      return;
    }

    const member = findRegistrationByMobile(registrations, dialCode, mobile);
    if (!member) {
      setError(t.loginErrorNoReg);
      return;
    }

    const sent = await requestOtp();
    if (!sent) return;

    setMobile(normalizeMobile(mobile));
    setStep('otp');
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSendingOtp(true);
    const result = await resendPhoneOtp(dialCode, mobile, otpReqId);
    setIsSendingOtp(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setOtpDemoMode(result.demo ?? false);
    if (result.reqId) setOtpReqId(result.reqId);
    setResendCooldown(30);
    setOtp('');
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsVerifying(true);

    const result = await verifyPhoneOtp(dialCode, mobile, otp, otpReqId);
    if (!result.success) {
      setError(result.message || t.loginErrorInvalidOtp);
      setIsVerifying(false);
      return;
    }

    const member = findRegistrationByMobile(registrations, dialCode, mobile);
    if (!member) {
      setError(t.loginErrorNotFound);
      setIsVerifying(false);
      return;
    }

    const authSession: AuthSession = {
      mobileNumber: mobile,
      mobileCountryCode: dialCode,
      registrationId: member.id,
      loggedInAt: new Date().toISOString(),
    };

    setSession(authSession);
    setIsVerifying(false);
    onLoginSuccess(authSession);
  };

  if (step === 'otp') {
    return (
      <OtpVerificationStep
        mobile={mobile}
        dialCode={dialCode}
        otp={otp}
        onOtpChange={setOtp}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => {
          setStep('mobile');
          setOtp('');
          setOtpReqId(undefined);
          setError('');
        }}
        error={error}
        isVerifying={isVerifying}
        isSending={isSendingOtp}
        resendCooldown={resendCooldown}
        demoMode={otpDemoMode && !widgetMode}
        title={t.loginOtpTitle}
        language={language}
      />
    );
  }

  return (
    <motion.div {...pageEnter} className="w-full max-w-md mx-auto min-w-0 py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-center space-y-2"
      >
        <div className="w-14 h-14 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
          <LogIn className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900">{t.loginTitle}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{t.loginSub}</p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        onSubmit={handleSendOtp}
        className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 w-full min-w-0"
      >
        <MobileWithCountryCode
          dialCode={dialCode}
          onDialCodeChange={setDialCode}
          mobile={mobile}
          onMobileChange={setMobile}
          error={error}
          language={language}
        />

        {widgetMode && <Msg91CaptchaMount />}

        <motion.button
          type="submit"
          disabled={isSendingOtp}
          {...tapScale}
          className="w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {isSendingOtp ? t.otpSending : t.loginSendOtp}
        </motion.button>
      </motion.form>

      <p className="text-center text-xs text-slate-500">
        {t.loginNotRegistered}{' '}
        <button
          type="button"
          onClick={onNavigateRegister}
          className="text-primary font-bold hover:underline cursor-pointer"
        >
          {t.loginRegisterHere}
        </button>
      </p>
    </motion.div>
  );
}
