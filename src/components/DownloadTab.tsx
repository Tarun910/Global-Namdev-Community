import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import IdCardPreview from './IdCardPreview';
import MobileWithCountryCode from './MobileWithCountryCode';
import OtpVerificationStep from './OtpVerificationStep';
import Msg91CaptchaMount from './Msg91CaptchaMount';
import { Registration } from '../types';
import { Download, RefreshCw, FileText, ShieldCheck } from 'lucide-react';
import { downloadIdCardPdf, downloadIdCardPng } from '../lib/idCardDownload';
import {
  findRegistrationByMobile,
  isValidLocalMobile,
  normalizeMobile,
} from '../lib/demoAuth';
import { resendPhoneOtp, sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';
import { useOtpMode } from '../hooks/useOtpMode';
import { getTranslations } from '../lib/translations';
import { Language } from '../lib/languages';

interface DownloadTabProps {
  registrations: Registration[];
  language: Language;
}

type DownloadStep = 'mobile' | 'otp' | 'card';

export default function DownloadTab({ registrations, language }: DownloadTabProps) {
  const t = getTranslations(language);
  const { widgetMode } = useOtpMode();
  const [step, setStep] = useState<DownloadStep>('mobile');
  const [dialCode, setDialCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpDemoMode, setOtpDemoMode] = useState(false);
  const [otpReqId, setOtpReqId] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifiedMember, setVerifiedMember] = useState<Registration | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

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

  const resetFlow = () => {
    setStep('mobile');
    setOtp('');
    setError('');
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
          title={t.verifyCommunityIdTitle}
          subtitle={t.viewCommunityIdOtpSub}
          language={language}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          {t.secureCommunityIdAccess}
        </div>
        <h2 className="font-sans text-2xl md:text-3xl font-bold text-slate-900">{t.viewCommunityIdTitle}</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">{t.viewCommunityIdSub}</p>
      </div>

      {step === 'mobile' && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSendOtp}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4"
        >
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
            className="w-full py-3 bg-primary text-white font-geist text-sm font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSendingOtp ? t.otpSending : t.loginSendOtp}
          </button>
        </motion.form>
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

            <button
              type="button"
              onClick={resetFlow}
              className="w-full text-xs text-slate-500 hover:text-primary font-semibold cursor-pointer flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Use a different number
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
