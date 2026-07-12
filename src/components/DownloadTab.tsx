import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import IdCardPreview from './IdCardPreview';
import MobileWithCountryCode from './MobileWithCountryCode';
import OtpVerificationStep from './OtpVerificationStep';
import Msg91CaptchaMount from './Msg91CaptchaMount';
import { Registration } from '../types';
import { Download, RefreshCw, FileText, ShieldCheck, KeyRound } from 'lucide-react';
import { downloadIdCardPdf, downloadIdCardPng } from '../lib/idCardDownload';
import {
  findRegistrationByMobile,
  isValidLocalMobile,
  normalizeMobile,
} from '../lib/demoAuth';
import { resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';
import { isOtpFallbackEligible, otpUnavailableMessage } from '../lib/otpFallback';
import {
  authenticateMemberWithPassword,
  findRegistrationByIdentifier,
  isCommunityIdIdentifier,
} from '../lib/memberAuth';
import { isSupabaseConfigured } from '../lib/supabase/client';
import { validateMemberLoginPasswordField } from '../lib/validateForms';
import { useOtpMode } from '../hooks/useOtpMode';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';

interface DownloadTabProps {
  registrations: Registration[];
  language: Language;
  loggedInMember?: Registration | null;
}

type DownloadStep = 'auth' | 'otp' | 'card';

export default function DownloadTab({ registrations, language, loggedInMember = null }: DownloadTabProps) {
  const t = getTranslations(language);
  const { widgetMode } = useOtpMode();
  const [step, setStep] = useState<DownloadStep>(loggedInMember ? 'card' : 'auth');
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [dialCode, setDialCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isPasswordChecking, setIsPasswordChecking] = useState(false);
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedMember, setVerifiedMember] = useState<Registration | null>(loggedInMember);
  const [isRendering, setIsRendering] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const usingSupabase = isSupabaseConfigured();
  const passwordUsesMemberId = isCommunityIdIdentifier(loginId);

  useEffect(() => {
    if (loggedInMember) {
      setVerifiedMember(loggedInMember);
      setStep('card');
    }
  }, [loggedInMember]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!isValidLocalMobile(mobile)) {
      setError('Enter a valid mobile number.');
      return;
    }

    const member = findRegistrationByMobile(registrations, dialCode, mobile);
    if (!member) {
      setError('No registration found for this mobile number. Please register first.');
      return;
    }

    setIsSendingOtp(true);
    const result = await sendPhoneOtp(dialCode, mobile);
    setIsSendingOtp(false);

    if (!result.success) {
      if (isOtpFallbackEligible(result)) {
        setAuthMode('password');
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
        setAuthMode('password');
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
      setError('Registration not found.');
      setIsVerifying(false);
      return;
    }

    setVerifiedMember(member);
    setIsVerifying(false);
    setStep('card');
  };

  const handlePasswordAccess = async (e: FormEvent) => {
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

    setIsPasswordChecking(true);
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

      setVerifiedMember(result.member);
      setStep('card');
    } finally {
      setIsPasswordChecking(false);
    }
  };

  const resetFlow = () => {
    if (loggedInMember) return;
    setStep('auth');
    setAuthMode('otp');
    setOtp('');
    setError('');
    setInfo('');
    setVerifiedMember(null);
  };

  const handleDownloadPng = () => {
    if (!verifiedMember) return;
    setIsRendering(true);
    void downloadIdCardPng(verifiedMember).finally(() => setIsRendering(false));
  };

  const handleDownloadPdf = () => {
    if (!verifiedMember) return;
    setIsRendering(true);
    void downloadIdCardPdf(verifiedMember).finally(() => setIsRendering(false));
  };

  if (step === 'otp') {
    return (
      <div className="max-w-md mx-auto py-6">
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
            setAuthMode('password');
            setLoginId(mobile);
            setInfo(t.loginOtpSkipHint);
          }}
          skipLabel={t.otpNotReceivedPasswordBtn}
          error={error}
          isVerifying={isVerifying}
          isSending={isSendingOtp}
          resendCooldown={resendCooldown}
          demoMode={otpDemoMode && !widgetMode}
          title={t.verifyCommunityIdTitle}
          subtitle={t.viewCommunityIdOtpSub}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-4">
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.secureCommunityIdAccess}
        </div>
        <h2 className="font-sans text-xl md:text-2xl font-bold text-slate-900">{t.viewCommunityIdTitle}</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-snug">{t.viewCommunityIdSub}</p>
      </div>

      {step === 'auth' && !loggedInMember && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden max-w-md mx-auto">
          <div className="flex border-b border-slate-100 bg-slate-50/80 p-1">
            <button
              type="button"
              onClick={() => setAuthMode('otp')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                authMode === 'otp' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
              }`}
            >
              {t.loginModeOtp}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('password')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                authMode === 'password' ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
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

          {authMode === 'otp' ? (
            <form onSubmit={handleSendOtp} className="p-4 space-y-2.5">
              <MobileWithCountryCode
                dialCode={dialCode}
                onDialCodeChange={setDialCode}
                mobile={mobile}
                onMobileChange={setMobile}
              />
              {widgetMode && <Msg91CaptchaMount />}
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={isSendingOtp}
                className="w-full py-2.5 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSendingOtp ? t.otpSending : t.loginSendOtp}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordAccess} className="p-4 space-y-2.5">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  {t.loginPasswordLabel}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-xl pl-9 pr-3 py-2.5 text-xs ${
                      fieldErrors.password ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-[10px] text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={isPasswordChecking}
                className="w-full py-2.5 bg-primary text-white font-geist text-sm font-bold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                {isPasswordChecking ? t.loginPasswordSigningIn : t.loginPasswordBtn}
              </button>
            </form>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'card' && verifiedMember && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-6"
          >
            <IdCardPreview member={verifiedMember} />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isRendering}
                className="flex-1 py-3 bg-primary text-white font-geist text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-white" />
                {isRendering ? 'Preparing...' : t.downloadPngCard}
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isRendering}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-geist text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <FileText className="w-4 h-4 text-primary" />
                {t.downloadPdfCard}
              </button>
            </div>

            {!loggedInMember && (
              <button
                type="button"
                onClick={resetFlow}
                className="w-full text-xs text-slate-500 hover:text-primary font-semibold cursor-pointer flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Use a different account
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
