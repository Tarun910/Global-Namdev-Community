import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { LogIn, KeyRound } from 'lucide-react';
import { Registration } from '../types';
import {
  normalizeMobile,
  setSession,
  findRegistrationByMobile,
  isValidLocalMobile,
  AuthSession,
} from '../lib/demoAuth';
import { resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';
import { isOtpFallbackEligible, otpUnavailableMessage } from '../lib/otpFallback';
import {
  authenticateMemberWithPassword,
  findRegistrationByIdentifier,
  isCommunityIdIdentifier,
  memberHasPassword,
} from '../lib/memberAuth';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { validateMemberLoginPasswordField } from '../lib/validateForms';
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
  onNavigateForgotPassword?: () => void;
  language: Language;
}

type LoginStep = 'auth' | 'otp';

export default function LoginTab({
  registrations,
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgotPassword,
  language,
}: LoginTabProps) {
  const t = getTranslations(language);
  const { widgetMode } = useOtpMode();
  const [step, setStep] = useState<LoginStep>('auth');
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [dialCode, setDialCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isPasswordLoggingIn, setIsPasswordLoggingIn] = useState(false);
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const usingSupabase = isSupabaseConfigured();
  const passwordUsesMemberId = isCommunityIdIdentifier(loginId);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const completeLogin = (member: Registration) => {
    const authSession: AuthSession = {
      mobileNumber: member.mobileNumber,
      mobileCountryCode: member.mobileCountryCode ?? '+91',
      registrationId: member.id,
      loggedInAt: new Date().toISOString(),
    };
    setSession(authSession);
    onLoginSuccess(authSession);
  };

  const requestOtp = async () => {
    setError('');
    setInfo('');
    setIsSendingOtp(true);
    const result = await sendPhoneOtp(dialCode, mobile);
    setIsSendingOtp(false);

    if (!result.success) {
      if (isOtpFallbackEligible(result)) {
        setLoginMode('password');
        setLoginId(mobile);
        setInfo(otpUnavailableMessage(language === 'en' ? 'en' : 'hi'));
        return false;
      }
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
    setInfo('');

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
      if (isOtpFallbackEligible(result)) {
        setStep('auth');
        setLoginMode('password');
        setLoginId(mobile);
        setInfo(otpUnavailableMessage(language === 'en' ? 'en' : 'hi'));
        return;
      }
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

    completeLogin(member);
    setIsVerifying(false);
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const passwordErrors = validateMemberLoginPasswordField(password);
    setFieldErrors(passwordErrors);
    if (Object.keys(passwordErrors).length > 0) return;

    const identifier = loginId.trim();
    if (!identifier) {
      setError(t.loginErrorIdentifierRequired);
      return;
    }

    const member = findRegistrationByIdentifier(registrations, identifier, dialCode);
    if (!member) {
      setError(t.loginErrorNoReg);
      return;
    }

    const hasPassword = await memberHasPassword(member, usingSupabase);
    if (!hasPassword) {
      setError(t.loginErrorNoPasswordSet);
      return;
    }

    setIsPasswordLoggingIn(true);
    try {
      const result = await authenticateMemberWithPassword(
        registrations,
        identifier,
        password,
        dialCode,
        usingSupabase,
      );

      if (!result) {
        setError(t.loginErrorInvalidPassword);
        return;
      }

      completeLogin(result.member);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loginErrorInvalidPassword;
      setError(message);
    } finally {
      setIsPasswordLoggingIn(false);
    }
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
          setStep('auth');
          setOtp('');
          setOtpReqId(undefined);
          setError('');
        }}
        onSkip={() => {
          setStep('auth');
          setLoginMode('password');
          setLoginId(mobile);
          setInfo(t.loginOtpSkipHint);
        }}
        skipLabel={t.otpNotReceivedPasswordBtn}
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
    <motion.div {...pageEnter} className="w-full max-w-md mx-auto min-w-0 py-4 space-y-4">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center mx-auto">
          <LogIn className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-sans text-xl md:text-2xl font-bold text-slate-900">{t.loginTitle}</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-snug">{t.loginSub}</p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/80 p-1">
        <button
          type="button"
          onClick={() => {
            setLoginMode('otp');
            setError('');
            setInfo('');
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            loginMode === 'otp' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
          }`}
        >
          {t.loginModeOtp}
        </button>
        <button
          type="button"
          onClick={() => {
            setLoginMode('password');
            setError('');
            setInfo('');
            if (!loginId.trim() && mobile.trim()) {
              setLoginId(mobile);
            }
          }}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            loginMode === 'password' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
          }`}
        >
          {t.loginModePassword}
        </button>
        </div>

        {info && (
          <div className="mx-4 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            {info}
          </div>
        )}

        {loginMode === 'otp' ? (
          <form onSubmit={handleSendOtp} className="p-4 space-y-2.5">
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
            className="w-full py-2.5 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {isSendingOtp ? t.otpSending : t.loginSendOtp}
          </motion.button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="p-4 space-y-2.5">
          {!passwordUsesMemberId ? (
            <MobileWithCountryCode
              dialCode={dialCode}
              onDialCodeChange={setDialCode}
              mobile={loginId}
              onMobileChange={setLoginId}
              language={language}
            />
          ) : (
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                {t.loginIdentifierLabel}
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={t.loginIdentifierPh}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
            )}

            <div className="flex items-center justify-between gap-2">
              {!passwordUsesMemberId ? (
                <p className="text-[10px] text-slate-400 leading-snug">{t.loginIdentifierHint}</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setLoginId(passwordUsesMemberId ? '' : 'GNC-')}
                className="text-[10px] font-semibold text-primary hover:underline cursor-pointer shrink-0"
              >
                {passwordUsesMemberId ? t.loginUseMobileInstead : t.loginUseMemberIdInstead}
              </button>
            </div>

            <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {t.loginPasswordLabel}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.password;
                    return next;
                  });
                }}
                placeholder={t.loginPasswordPh}
                className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-none ${
                  fieldErrors.password ? 'border-red-400' : 'border-slate-200'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-[10px] text-red-500 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <motion.button
            type="submit"
            disabled={isPasswordLoggingIn}
            {...tapScale}
            className="w-full py-2.5 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {isPasswordLoggingIn ? t.loginPasswordSigningIn : t.loginPasswordBtn}
          </motion.button>

          {onNavigateForgotPassword && (
            <button
              type="button"
              onClick={onNavigateForgotPassword}
              className="w-full text-[11px] font-semibold text-slate-500 hover:text-primary cursor-pointer"
            >
              {t.forgotPasswordLink}
            </button>
          )}
          </form>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 pt-1">
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
